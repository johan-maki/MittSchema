
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Shift } from "@/types/shift";

export const useScheduleActionHandlers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/schedule/settings');
  };

  const handlePublishSchedule = async () => {
    try {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('is_published', false);

      if (updateError) throw updateError;

      toast({
        title: "Schema publicerat",
        description: "Alla schemalagda pass har publicerats.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte publicera schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleClearUnpublished = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('is_published', false);

      if (deleteError) throw deleteError;

      toast({
        title: "Schema rensat",
        description: "Alla opublicerade pass har tagits bort.",
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error clearing schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte rensa schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleApplySchedule = async (generatedShifts: Shift[], onSuccess: () => void) => {
    try {
      // First deduplicate shifts to prevent the same person working multiple shifts of same type on same day
      const uniqueShifts = deduplicateShifts(generatedShifts);
      
      if (uniqueShifts.length < generatedShifts.length) {
        console.log(`Removed ${generatedShifts.length - uniqueShifts.length} duplicate shifts`);
      }
      
      const shiftsToInsert = uniqueShifts.map(shift => ({
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department || 'General',
        employee_id: shift.employee_id,
        is_published: false
      }));

      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Schema applicerat",
        description: "Det nya schemat har sparats.",
      });

      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    } catch (error) {
      console.error('Error applying schedule:', error);
      toast({
        title: "Ett fel uppstod",
        description: "Kunde inte spara schemat. Försök igen.",
        variant: "destructive",
      });
    }
  };

  // Helper function to remove duplicate shifts (same employee, same day, same shift type)
  const deduplicateShifts = (shifts: Shift[]): Shift[] => {
    const uniqueKeys = new Map<string, Shift>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
      const key = `${shift.employee_id}-${dateStr}-${shift.shift_type}`;
      
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, shift);
      }
    });
    
    return Array.from(uniqueKeys.values());
  };

  return {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule,
  };
};
