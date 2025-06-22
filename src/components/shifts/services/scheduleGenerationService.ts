import { format } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { deduplicateShifts } from "../utils/validation";



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

// Gurobi-only two-week generation function
export const generateScheduleForTwoWeeks = async (
  currentDate: Date,
  profiles: Profile[],
  settings: any,
  timestamp?: number,
  onProgress?: (step: string, progress: number) => void
): Promise<{ 
  schedule: Shift[], 
  staffingIssues?: { date: string; shiftType: string; current: number; required: number }[],
  coverage_stats?: any,
  fairness_stats?: any 
}> => {
  // Calculate two-week period starting from TODAY (not last Sunday)
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Start from today at midnight
  
  const twoWeeksEnd = new Date(startDate);
  twoWeeksEnd.setDate(twoWeeksEnd.getDate() + 13); // 14 days total
  
  onProgress?.('🚀 Initializing Gurobi schedule optimization...', 0);
  
  console.log('🗓️ Generating two-week schedule with Gurobi:', {
    startDate: startDate.toISOString().split('T')[0],
    twoWeeksEnd: twoWeeksEnd.toISOString().split('T')[0],
    profiles: profiles.length,
    useGurobi: true
  });
  
  // Validate inputs
  if (!profiles || profiles.length === 0) {
    throw new Error('No employees available for scheduling');
  }

  // Extract Gurobi parameters from settings
  const gurobiConfig = {
    minStaffPerShift: settings?.minStaffPerShift || 1,
    minExperiencePerShift: settings?.minExperiencePerShift || 1,
    includeWeekends: settings?.includeWeekends !== false // Default to true
  };

  console.log('🎯 Using Gurobi configuration:', gurobiConfig);

  onProgress?.('⚡ Calling Gurobi optimizer...', 20);
  
  const response = await schedulerApi.generateSchedule(
    startDate.toISOString(),
    twoWeeksEnd.toISOString(),
    settings?.department || 'Akutmottagning',
    gurobiConfig.minStaffPerShift,
    gurobiConfig.minExperiencePerShift,
    gurobiConfig.includeWeekends,
    timestamp || Date.now()
  );
  
  onProgress?.('📊 Processing Gurobi results...', 60);
  
  console.log('🎉 Gurobi optimization response:', response);
  
  if (!response.schedule || response.schedule.length === 0) {
    throw new Error('Gurobi optimizer could not generate a schedule with the current constraints. Please review employee availability and constraints, then try again.');
  }
  
  // Convert Gurobi response to our Shift format
  console.log('🔍 DEBUG: First shift from Gurobi:', response.schedule[0]);
  const convertedSchedule: Shift[] = response.schedule.map((shift: any, index: number) => {
    console.log(`🔍 DEBUG: Converting shift ${index}:`, {
      start_time: shift.start_time,
      end_time: shift.end_time,
      start_time_type: typeof shift.start_time,
      end_time_type: typeof shift.end_time,
      date: shift.date
    });
    
    return {
      id: uuidv4(),
      employee_id: shift.employee_id,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      is_published: false,
      department: shift.department || 'Akutmottagning'
    };
  });
  
  console.log('🔍 DEBUG: Before deduplication - sample shift:', convertedSchedule[0]);
  const deduplicatedSchedule = deduplicateShifts(convertedSchedule);
  console.log('🔍 DEBUG: After deduplication - schedule length:', deduplicatedSchedule.length);
  
  console.log(`✅ Gurobi generated ${deduplicatedSchedule.length} shifts for two weeks`);
  console.log(`📈 Coverage: ${response.coverage_stats?.coverage_percentage || 0}%`);
  console.log(`⚖️ Fairness range: ${response.fairness_stats?.shift_distribution_range || 0} shifts`);
  
  onProgress?.('🎯 Gurobi optimization complete!', 100);
  
  const finalResult = {
    schedule: deduplicatedSchedule,
    staffingIssues: [], // Gurobi should minimize these
    coverage_stats: response.coverage_stats,
    fairness_stats: response.fairness_stats
  };
  
  console.log('🔍 DEBUG: Final result from generateScheduleForTwoWeeks:', finalResult);
  console.log('🔍 DEBUG: Final result schedule length:', finalResult.schedule.length);
  
  return finalResult;
};
