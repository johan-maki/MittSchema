
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Shift } from "@/types/shift";

export const useScheduleApplier = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      // Use Gurobi optimized shifts directly without deduplication
      console.log("Preparing to insert", generatedShifts.length, "Gurobi-optimized shifts");
      
      // Process shifts in smaller batches to avoid timeouts
      const BATCH_SIZE = 10; // Reducing to even smaller batch size for better reliability
      const shiftsToInsert = generatedShifts.map(shift => ({
        id: shift.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate an ID if not present
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
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
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

  return {
    handleApplySchedule,
  };
};
