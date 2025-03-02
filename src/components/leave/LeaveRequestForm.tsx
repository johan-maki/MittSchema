
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const LEAVE_TYPES = [
  { id: "vacation", label: "Semester" },
  { id: "sick", label: "Sjukdom" },
  { id: "personal", label: "Personliga skäl" },
  { id: "education", label: "Utbildning" },
  { id: "other", label: "Annat" },
];

export function LeaveRequestForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skicka en frånvaroansökan",
        variant: "destructive",
      });
      return;
    }
    
    if (!startDate || !endDate || !leaveType) {
      toast({
        title: "Ofullständig information",
        description: "Vänligen fyll i alla obligatoriska fält",
        variant: "destructive",
      });
      return;
    }
    
    if (endDate < startDate) {
      toast({
        title: "Fel datumintervall",
        description: "Slutdatum måste vara efter startdatum",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('leave_requests').insert({
        employee_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        leave_type: leaveType,
        reason,
        status: 'pending'
      });
      
      if (error) throw error;
      
      // Create notification for managers
      await supabase.from('notifications').insert({
        recipient_type: 'manager',
        title: 'Ny frånvaroansökan',
        content: `En ny frånvaroansökan har skickats in för perioden ${format(startDate, 'yyyy-MM-dd')} till ${format(endDate, 'yyyy-MM-dd')}`,
        link: '/leave-management',
        is_read: false
      });
      
      toast({
        title: "Frånvaroansökan skickad",
        description: "Din ansökan har skickats in och väntar på godkännande",
      });
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveType("");
      setReason("");
      
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error: any) {
      console.error("Error submitting leave request:", error);
      toast({
        title: "Ett fel uppstod",
        description: error.message || "Kunde inte skicka frånvaroansökan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Ansök om frånvaro</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Startdatum *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {startDate ? (
                    format(startDate, "yyyy-MM-dd")
                  ) : (
                    <span className="text-muted-foreground">Välj datum</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Slutdatum *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {endDate ? (
                    format(endDate, "yyyy-MM-dd")
                  ) : (
                    <span className="text-muted-foreground">Välj datum</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Typ av frånvaro *</label>
          <Select value={leaveType} onValueChange={setLeaveType}>
            <SelectTrigger>
              <SelectValue placeholder="Välj typ av frånvaro" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Anledning</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Beskriv anledningen till din frånvaro"
            rows={3}
          />
        </div>
        
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Skickar..." : "Skicka ansökan"}
        </Button>
      </form>
    </Card>
  );
}
