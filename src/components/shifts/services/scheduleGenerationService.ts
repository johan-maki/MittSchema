
import { format, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { generateBasicSchedule } from "../utils/localScheduleGenerator";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { deduplicateShifts } from "../utils/validation";

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
    timestamp: timestamp || Date.now(), // Ensure we always have a timestamp
    profiles: profiles.length
  });

  try {
    // Call the Scheduler API directly with timestamp to ensure randomization
    const response = await schedulerApi.generateSchedule(
      monthStart.toISOString(),
      monthEnd.toISOString(),
      settings?.department || 'General',
      timestamp || Date.now() // Ensure we always have a timestamp
    );
    
    console.log('Schedule optimization response:', response);
    
    // If the API returned an empty schedule, fall back to local generation
    if (!response.schedule || response.schedule.length === 0) {
      console.log('API returned empty schedule, falling back to local generation');
      return generateBasicSchedule(monthStart, monthEnd, profiles, settings);
    }
    
    // Pre-deduplicate before applying strict constraints
    const preDeduplicatedSchedule = preDeduplicateShifts(response.schedule || []);
    
    // Apply strict deduplication to enforce all constraints
    const deduplicatedSchedule = deduplicateShifts(preDeduplicatedSchedule);
    console.log(`Deduplicated schedule from ${response.schedule?.length || 0} to ${deduplicatedSchedule.length} shifts`);
    
    // Ensure the response includes staffing issues if available
    return {
      schedule: deduplicatedSchedule,
      staffingIssues: response.staffingIssues || []
    };
  } catch (error) {
    console.error('API call failed:', error);
    
    // Fallback to local generation if the API fails
    console.log('Falling back to local schedule generation');
    const localSchedule = await generateBasicSchedule(monthStart, monthEnd, profiles, settings);
    
    // Deduplicate locally generated shifts too
    const deduplicatedLocalSchedule = {
      schedule: deduplicateShifts(localSchedule.schedule),
      staffingIssues: localSchedule.staffingIssues
    };
    
    return deduplicatedLocalSchedule;
  }
};

/**
 * Simple pre-deduplication to ensure one shift per employee per day
 */
function preDeduplicateShifts(shifts: Shift[]): Shift[] {
  const uniqueEmployeeShifts = new Map<string, Shift>();
  
  for (const shift of shifts) {
    const shiftDate = new Date(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const key = `${shift.employee_id}-${dateStr}`;
    
    // Only keep one shift per employee per day (first one encountered)
    if (!uniqueEmployeeShifts.has(key)) {
      uniqueEmployeeShifts.set(key, shift);
    }
  }
  
  return Array.from(uniqueEmployeeShifts.values());
}

// Save generated shifts to Supabase
export const saveScheduleToSupabase = async (shifts: Shift[]): Promise<boolean> => {
  try {
    if (!shifts || shifts.length === 0) {
      console.log("No shifts to save");
      return false;
    }
    
    // Apply one more round of deduplication before saving to ensure constraints are met
    const finalShifts = deduplicateShifts(shifts);
    console.log(`Final deduplication: from ${shifts.length} to ${finalShifts.length} shifts`);
    
    console.log(`Saving ${finalShifts.length} shifts to Supabase`);
    
    // Process shifts in smaller batches to avoid timeouts
    const BATCH_SIZE = 10;
    const shiftsToInsert = finalShifts.map(shift => ({
      id: shift.id || uuidv4(), // Generate proper UUIDs for new shifts
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      department: shift.department || 'General',
      employee_id: shift.employee_id,
      is_published: false
    }));
    
    // Clear all existing unpublished shifts first
    const { error: clearError } = await supabase
      .from('shifts')
      .delete()
      .eq('is_published', false);
      
    if (clearError) {
      console.error("Error clearing unpublished shifts:", clearError);
      throw new Error(`Could not clear existing shifts: ${clearError.message}`);
    }
    
    // Insert shifts in batches
    for (let i = 0; i < shiftsToInsert.length; i += BATCH_SIZE) {
      const batch = shiftsToInsert.slice(i, i + BATCH_SIZE);
      console.log(`Inserting batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(shiftsToInsert.length/BATCH_SIZE)}, size: ${batch.length}`);
      
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(batch);
        
      if (insertError) {
        console.error("Error inserting batch:", insertError);
        throw new Error(`Could not save batch: ${insertError.message}`);
      }
      
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving shifts to Supabase:", error);
    return false;
  }
};
