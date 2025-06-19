import { format, startOfMonth, endOfMonth } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { generateBasicSchedule, generateEnhancedLocalSchedule } from "../utils/localScheduleGenerator";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { deduplicateShifts } from "../utils/validation";

export const generateScheduleForMonth = async (
  currentDate: Date,
  profiles: Profile[],
  settings: any,
  timestamp?: number,
  onProgress?: (step: string, progress: number) => void
): Promise<{ schedule: Shift[], staffingIssues?: { date: string; shiftType: string; current: number; required: number }[] }> => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  onProgress?.('Initializing schedule generation...', 0);
  
  // Validate inputs
  if (!profiles || profiles.length === 0) {
    throw new Error('No employees available for scheduling');
  }
  
  console.log('Calling optimization API with dates:', {
    startDate: monthStart.toISOString(),
    endDate: monthEnd.toISOString(),
    timestamp: timestamp || Date.now(),
    profiles: profiles.length
  });

  try {
    onProgress?.('Calling schedule optimization API...', 20);
    
    // Call the Scheduler API directly with timestamp to ensure randomization
    const response = await schedulerApi.generateSchedule(
      monthStart.toISOString(),
      monthEnd.toISOString(),
      settings?.department || 'General',
      timestamp || Date.now() // Ensure we always have a timestamp
    );
    
    onProgress?.('Processing API response...', 40);
    console.log('Schedule optimization response:', response);
    
    // If the API returned an empty schedule, fall back to local generation
    if (!response.schedule || response.schedule.length === 0) {
      console.log('API returned empty schedule, falling back to local generation');
      onProgress?.('Falling back to local generation...', 60);
      return generateBasicSchedule(monthStart, monthEnd, profiles, settings);
    }
    
    onProgress?.('Deduplicating shifts...', 80);
    
    // Pre-deduplicate before applying strict constraints
    const preDeduplicatedSchedule = preDeduplicateShifts(response.schedule || []);
    
    // Apply strict deduplication to enforce all constraints
    const deduplicatedSchedule = deduplicateShifts(preDeduplicatedSchedule);
    console.log(`Deduplicated schedule from ${response.schedule?.length || 0} to ${deduplicatedSchedule.length} shifts`);
    
    onProgress?.('Schedule generation complete', 100);
    
    // Ensure the response includes staffing issues if available
    return {
      schedule: deduplicatedSchedule,
      staffingIssues: response.staffingIssues || []
    };
  } catch (error) {
    console.error('API call failed:', error);
    
    onProgress?.('API failed, falling back to local generation...', 60);
    
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

// NEW: Two-week generation function with Gurobi optimization
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

  // Try Gurobi API first (now available locally)
  try {
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
    
    if (response.schedule && response.schedule.length > 0) {
      // Convert Gurobi response to our Shift format
      const convertedSchedule = response.schedule.map((shift: any) => ({
        id: uuidv4(),
        employee_id: shift.employee_id,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_type: shift.shift_type,
        is_published: false,
        department: shift.department || 'Akutmottagning'
      }));
      
      const deduplicatedSchedule = deduplicateShifts(convertedSchedule);
      
      console.log(`✅ Gurobi generated ${deduplicatedSchedule.length} shifts for two weeks`);
      console.log(`📈 Coverage: ${response.coverage_stats?.coverage_percentage || 0}%`);
      console.log(`⚖️ Fairness range: ${response.fairness_stats?.shift_distribution_range || 0} shifts`);
      
      onProgress?.('🎯 Gurobi optimization complete!', 100);
      
      return {
        schedule: deduplicatedSchedule,
        staffingIssues: [], // Gurobi should minimize these
        coverage_stats: response.coverage_stats,
        fairness_stats: response.fairness_stats
      };
    } else {
      console.warn('⚠️ Gurobi returned empty schedule');
    }
  } catch (error) {
    console.error('💥 Gurobi API failed, using local generation fallback:', error);
  }
  
  // Fallback to local generation only if Gurobi fails
  console.log('🔄 Falling back to enhanced local generation...');
  onProgress?.('🛠️ Generating locally for two weeks...', 70);
  const localSchedule = await generateEnhancedLocalSchedule(startDate, twoWeeksEnd, profiles, settings, onProgress);
  
  onProgress?.('✅ Two-week schedule complete', 100);
  return {
    schedule: deduplicateShifts(localSchedule.schedule),
    staffingIssues: localSchedule.staffingIssues
  };
};
