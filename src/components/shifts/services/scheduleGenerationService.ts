
import { format, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { generateBasicSchedule } from "../utils/localScheduleGenerator";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";
import { useToast } from "@/components/ui/use-toast";

export const generateScheduleForMonth = async (
  currentDate: Date,
  profiles: Profile[],
  settings: any,
  timestamp?: number // Optional timestamp to ensure different results each time
): Promise<{ schedule: Shift[], staffingIssues?: { date: string; shiftType: string; current: number; required: number }[] }> => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  console.log('Calling optimization API with dates:', {
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
    timestamp: timestamp || 'none'
  });

  try {
    // Call the Scheduler API directly
    const response = await schedulerApi.generateSchedule(
      monthStart.toISOString(),
      monthEnd.toISOString(),
      settings?.department || 'General',
      timestamp // Pass the timestamp to avoid caching
    );
    
    console.log('Schedule optimization response:', response);
    
    // Ensure the response includes staffing issues if available
    return {
      schedule: response.schedule || [],
      staffingIssues: response.staffingIssues || []
    };
  } catch (error) {
    console.error('API call failed:', error);
    
    // Fallback to local generation if the API fails
    console.log('Falling back to local schedule generation');
    const localSchedule = await generateBasicSchedule(monthStart, monthEnd, profiles, settings);
    
    return localSchedule;
  }
};

// New function to directly save generated shifts to Supabase
export const saveScheduleToSupabase = async (shifts: Shift[]): Promise<boolean> => {
  try {
    if (!shifts || shifts.length === 0) {
      console.log("No shifts to save");
      return false;
    }
    
    console.log(`Saving ${shifts.length} shifts to Supabase`);
    
    // Process shifts in smaller batches to avoid timeouts
    const BATCH_SIZE = 10;
    const shiftsToInsert = shifts.map(shift => ({
      id: shift.id || `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        throw new Error(`Could not save batch: ${insertError.message}`);
      }
      
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}, received:`, data);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving shifts to Supabase:", error);
    return false;
  }
};
