
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeaveRequest, LeaveStatus } from "@/types/leave";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "Semester",
  sick: "Sjukdom",
  personal: "Personliga skäl",
  education: "Utbildning",
  other: "Annat",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Väntar på godkännande",
  approved: "Godkänd",
  rejected: "Avslagen",
};

export function ManagerLeaveRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['all-leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as LeaveRequest[];
    },
  });
  
  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    if (!user) return;
    
    setProcessingId(id);
    
    try {
      const updateData = { status };
      
      const { error } = await supabase
        .from('leave_requests')
        .update(updateData as any)
        .eq('id', id);
      
      if (error) throw error;
      
      const request = leaveRequests?.find(r => r.id === id);
      
      if (request) {
        // Create notification for employee
        const notificationData = {
          recipient_id: request.employee_id,
          title: `Frånvaroansökan ${status === 'approved' ? 'godkänd' : 'avslagen'}`,
          content: `Din frånvaroansökan för perioden ${format(parseISO(request.start_date), 'yyyy-MM-dd')} till ${format(parseISO(request.end_date), 'yyyy-MM-dd')} har blivit ${status === 'approved' ? 'godkänd' : 'avslagen'}.`,
          link: '/leave',
          is_read: false
        };
        
        await supabase
          .from('notifications')
          .insert(notificationData as any);
      }
      
      toast({
        title: `Frånvaroansökan ${status === 'approved' ? 'godkänd' : 'avslagen'}`,
        description: "Statusen har uppdaterats och medarbetaren har notifierats",
      });
      
      queryClient.invalidateQueries({ queryKey: ['all-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error: any) {
      console.error("Error updating leave request:", error);
      toast({
        title: "Ett fel uppstod",
        description: error.message || "Kunde inte uppdatera statusen",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  const pendingRequests = leaveRequests?.filter(r => r.status === 'pending') || [];
  const otherRequests = leaveRequests?.filter(r => r.status !== 'pending') || [];
  
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-4">Väntande ansökningar</h2>
        {pendingRequests.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            Det finns inga väntande frånvaroansökningar.
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {request.profiles.first_name} {request.profiles.last_name}
                      </span>
                      <Badge variant="outline" className={STATUS_COLORS[request.status]}>
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </div>
                    <div className="mb-1">
                      {format(parseISO(request.start_date), 'dd MMM', { locale: sv })} - {format(parseISO(request.end_date), 'dd MMM yyyy', { locale: sv })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}
                    </div>
                    {request.reason && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Anledning:</span> {request.reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50"
                      disabled={!!processingId}
                      onClick={() => handleStatusUpdate(request.id, 'approved')}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Godkänn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                      disabled={!!processingId}
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Avslå
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {otherRequests.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Tidigare ansökningar</h2>
          <div className="grid gap-4">
            {otherRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {request.profiles.first_name} {request.profiles.last_name}
                      </span>
                      <Badge variant="outline" className={STATUS_COLORS[request.status]}>
                        {STATUS_LABELS[request.status]}
                      </Badge>
                    </div>
                    <div className="mb-1">
                      {format(parseISO(request.start_date), 'dd MMM', { locale: sv })} - {format(parseISO(request.end_date), 'dd MMM yyyy', { locale: sv })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}
                    </div>
                    {request.reason && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Anledning:</span> {request.reason}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(parseISO(request.created_at), 'yyyy-MM-dd')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
