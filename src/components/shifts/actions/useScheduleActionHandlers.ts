
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
      // First deduplicate shifts based on employee ID, day, and shift type
      const uniqueShifts = deduplicateShifts(generatedShifts);
      
      if (uniqueShifts.length < generatedShifts.length) {
        console.log(`Removed ${generatedShifts.length - uniqueShifts.length} duplicate shifts`);
      }
      
      // Then validate that all required constraints are met
      const validatedShifts = validateShiftConstraints(uniqueShifts);
      
      if (!validatedShifts) {
        toast({
          title: "Schemaläggning misslyckades",
          description: "Schemat uppfyller inte alla begränsningar. Vissa pass saknas eller kraven uppfylls inte.",
          variant: "destructive",
        });
        return;
      }
      
      // Process shifts in smaller batches to avoid timeouts
      const BATCH_SIZE = 50;
      const shiftsToInsert = validatedShifts.map(shift => ({
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department || 'General',
        employee_id: shift.employee_id,
        is_published: false
      }));
      
      // Insert shifts in batches
      for (let i = 0; i < shiftsToInsert.length; i += BATCH_SIZE) {
        const batch = shiftsToInsert.slice(i, i + BATCH_SIZE);
        
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(batch);
          
        if (insertError) throw insertError;
      }

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
    const roleAssignments = new Map<string, Map<string, string>>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
      const key = `${shift.employee_id}-${dateStr}-${shift.shift_type}`;
      
      // Track role assignments by day - one person should only work one role per day
      if (!roleAssignments.has(dateStr)) {
        roleAssignments.set(dateStr, new Map<string, string>());
      }
      const dayRoles = roleAssignments.get(dateStr)!;
      
      // If this employee already has a role on this day, but it's a different shift type,
      // don't add this shift (prevents same person from working different roles same day)
      if (dayRoles.has(shift.employee_id) && dayRoles.get(shift.employee_id) !== shift.shift_type) {
        return;
      }
      
      // Set this employee's role for the day
      dayRoles.set(shift.employee_id, shift.shift_type);
      
      // Only add this shift if we don't already have it
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, shift);
      }
    });
    
    return Array.from(uniqueKeys.values());
  };

  // Validates if the schedule meets all required constraints
  const validateShiftConstraints = (shifts: Shift[]): Shift[] | null => {
    // Group shifts by day and shift type
    const shiftsByDayAndType = new Map<string, Map<string, Shift[]>>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = `${shiftDate.getFullYear()}-${shiftDate.getMonth()}-${shiftDate.getDate()}`;
      
      if (!shiftsByDayAndType.has(dateStr)) {
        shiftsByDayAndType.set(dateStr, new Map<string, Shift[]>());
      }
      
      const dayShifts = shiftsByDayAndType.get(dateStr)!;
      if (!dayShifts.has(shift.shift_type)) {
        dayShifts.set(shift.shift_type, []);
      }
      
      dayShifts.get(shift.shift_type)!.push(shift);
    });
    
    // Check if each day has the minimum required staff for each shift type
    const minStaffByShiftType = {
      'day': 3,
      'evening': 3,
      'night': 2
    };
    
    // Validate each day
    let isValid = true;
    shiftsByDayAndType.forEach((dayShifts, dateStr) => {
      // Check each shift type
      for (const [shiftType, minStaff] of Object.entries(minStaffByShiftType)) {
        const shiftsOfType = dayShifts.get(shiftType) || [];
        if (shiftsOfType.length < minStaff) {
          console.error(`Not enough staff for ${shiftType} shift on ${dateStr}: ${shiftsOfType.length}/${minStaff}`);
          isValid = false;
          break;
        }
      }
    });
    
    return isValid ? shifts : null;
  };

  return {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule,
  };
};
