
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Shift } from "@/types/shift";
import { format } from "date-fns";

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
    console.log("Starting handleApplySchedule with", generatedShifts.length, "shifts");
    
    if (generatedShifts.length === 0) {
      toast({
        title: "Tomt schema",
        description: "Det finns inga pass att applicera.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // First deduplicate shifts based on employee ID, day, and shift type
      const uniqueShifts = deduplicateShifts(generatedShifts);
      
      if (uniqueShifts.length < generatedShifts.length) {
        console.log(`Removed ${generatedShifts.length - uniqueShifts.length} duplicate shifts`);
      }
      
      console.log("Preparing to insert", uniqueShifts.length, "shifts");
      
      // Process shifts in smaller batches to avoid timeouts
      const BATCH_SIZE = 10; // Reducing to even smaller batch size for better reliability
      const shiftsToInsert = uniqueShifts.map(shift => ({
        id: shift.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate an ID if not present
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        department: shift.department || 'General',
        employee_id: shift.employee_id,
        is_published: false
      }));
      
      // Validate the shifts (but don't block insertion)
      validateShiftConstraints(shiftsToInsert);
      
      // Insert shifts in batches
      for (let i = 0; i < shiftsToInsert.length; i += BATCH_SIZE) {
        const batch = shiftsToInsert.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(shiftsToInsert.length/BATCH_SIZE)}, size: ${batch.length}`);
        
        const { data, error: insertError } = await supabase
          .from('shifts')
          .insert(batch)
          .select();
          
        if (insertError) {
          console.error("Error inserting batch:", insertError);
          throw new Error(`Kunde inte spara batchen: ${insertError.message}`);
        }
        
        console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}, received:`, data);
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
      throw error; // Re-throw to be caught in the UI component
    }
  };

  // Helper function to remove duplicate shifts (same employee, same day, same shift type)
  const deduplicateShifts = (shifts: Shift[]): Shift[] => {
    console.log("Running deduplicateShifts on", shifts.length, "shifts");
    const uniqueKeys = new Map<string, Shift>();
    const employeeAssignments = new Map<string, Map<string, string>>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = format(shiftDate, 'yyyy-MM-dd');
      const key = `${shift.employee_id}-${dateStr}-${shift.shift_type}`;
      
      // Track assignments by day - one person should only work one role per day
      if (!employeeAssignments.has(dateStr)) {
        employeeAssignments.set(dateStr, new Map<string, string>());
      }
      const dayAssignments = employeeAssignments.get(dateStr)!;
      
      // If this employee already has a shift on this day, but it's a different shift type,
      // don't add this shift (prevents same person from working different shifts same day)
      if (dayAssignments.has(shift.employee_id) && dayAssignments.get(shift.employee_id) !== shift.shift_type) {
        console.log(`Skipping duplicate shift for employee ${shift.employee_id} on ${dateStr} - already has ${dayAssignments.get(shift.employee_id)} shift`);
        return;
      }
      
      // Set this employee's shift for the day
      dayAssignments.set(shift.employee_id, shift.shift_type);
      
      // Only add this shift if we don't already have it
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, shift);
      }
    });
    
    const result = Array.from(uniqueKeys.values());
    console.log("After deduplication, have", result.length, "shifts");
    return result;
  };

  // Validation function for logging purposes but we won't stop the application
  const validateShiftConstraints = (shifts: Shift[]): boolean => {
    console.log("Running validation on shifts");
    // Group shifts by day and shift type
    const shiftsByDay = new Map<string, Map<string, Shift[]>>();
    
    shifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dateStr = format(shiftDate, 'yyyy-MM-dd');
      
      if (!shiftsByDay.has(dateStr)) {
        shiftsByDay.set(dateStr, new Map<string, Shift[]>());
      }
      
      const dayShifts = shiftsByDay.get(dateStr)!;
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
    shiftsByDay.forEach((dayShifts, dateStr) => {
      // Check each shift type
      for (const [shiftType, minStaff] of Object.entries(minStaffByShiftType)) {
        const shiftsOfType = dayShifts.get(shiftType) || [];
        if (shiftsOfType.length < minStaff) {
          console.log(`Not enough staff for ${shiftType} shift on ${dateStr}: ${shiftsOfType.length}/${minStaff}`);
          isValid = false;
        }
      }
    });
    
    if (!isValid) {
      console.log("Some shifts do not meet minimum staffing requirements");
    }
    
    return isValid;
  };

  return {
    handleSettingsClick,
    handlePublishSchedule,
    handleClearUnpublished,
    handleApplySchedule,
  };
};
