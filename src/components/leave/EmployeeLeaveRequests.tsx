
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LeaveRequest } from "@/types/leave";

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

export function EmployeeLeaveRequests() {
  const { user } = useAuth();
  
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leave-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          profiles:employee_id (
            first_name,
            last_name
          )
        `)
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as LeaveRequest[];
    },
    enabled: !!user,
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!leaveRequests || leaveRequests.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        Du har inga frånvaroansökningar ännu.
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dina frånvaroansökningar</h2>
      <div className="grid gap-4">
        {leaveRequests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">
                    {format(parseISO(request.start_date), 'dd MMM', { locale: sv })} - {format(parseISO(request.end_date), 'dd MMM yyyy', { locale: sv })}
                  </span>
                  <Badge variant="outline" className={STATUS_COLORS[request.status]}>
                    {STATUS_LABELS[request.status]}
                  </Badge>
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
    </div>
  );
}
