import { format } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { convertWorkPreferences } from "@/types/profile";

/**
 * Save generated shifts to Supabase database
 * Clears existing unpublished shifts and inserts new ones in batches
 */
export const saveScheduleToSupabase = async (shifts: Shift[]): Promise<boolean> => {
  try {
    if (!shifts || shifts.length === 0) {
      console.log("No shifts to save");
      return false;
    }
    
    console.log(`Saving ${shifts.length} Gurobi-optimized shifts to database`);
    
    // Process shifts in batches to avoid database timeouts
    const BATCH_SIZE = 10;
    const shiftsToInsert = shifts.map(shift => ({
      id: shift.id || uuidv4(),
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      department: shift.department || 'General',
      employee_id: shift.employee_id,
      is_published: false
    }));
    
    // Clear existing unpublished shifts first
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

/**
 * Generate optimized schedule for the next full calendar month using Gurobi
 * @param currentDate - Reference date (not used, kept for API compatibility)
 * @param profiles - Available employees
 * @param settings - Scheduling configuration
 * @param timestamp - Optional timestamp for tracking
 * @param onProgress - Progress callback function
 * @returns Generated schedule with statistics
 */
export const generateScheduleForNextMonth = async (
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
  // Calculate next full calendar month
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const startDate = new Date(nextMonth);
  startDate.setHours(0, 0, 0, 0);
  
  // Last day of next month
  const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  onProgress?.('🚀 Initializing Gurobi schedule optimization...', 0);
  
  console.log('🗓️ Generating next month schedule with Gurobi:', {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    employeeCount: profiles.length,
    daysInMonth: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  });
  
  // Validate inputs
  if (!profiles || profiles.length === 0) {
    throw new Error('No employees available for scheduling');
  }

  // Extract Gurobi parameters from settings
  const gurobiConfig = {
    minStaffPerShift: settings?.min_staff_per_shift || settings?.minStaffPerShift || 2, // Default to 2!
    minExperiencePerShift: settings?.min_experience_per_shift || settings?.minExperiencePerShift || 1,
    includeWeekends: settings?.include_weekends !== false && settings?.includeWeekends !== false // Default to true
  };

  console.log('🎯 Using Gurobi configuration:', gurobiConfig);

  onProgress?.('📋 Fetching employee preferences...', 10);
  
  // Fetch employee preferences from database
  const { data: employeeData, error: empError } = await supabase
    .from('employees')
    .select('id, work_preferences')
    .in('id', profiles.map(p => p.id));
    
  if (empError) {
    console.warn('Could not fetch employee preferences:', empError);
  }
  
  // Convert employee preferences to format expected by Gurobi API
  const employeePreferences = employeeData?.map(emp => {
    const workPrefs = convertWorkPreferences(emp.work_preferences);
    return {
      employee_id: emp.id,
      preferred_shifts: workPrefs.preferred_shifts || ["day", "evening", "night"],
      max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
      available_days: workPrefs.available_days || ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    };
  }) || [];
  
  console.log('👥 Employee preferences loaded:', employeePreferences);

  onProgress?.('⚡ Calling Gurobi optimizer...', 20);
  
  // 🔍 FINAL DIAGNOSTIC: What we're sending to Gurobi
  console.log('📤 SENDING TO GUROBI API:');
  console.log('  Start date:', startDate.toISOString());
  console.log('  End date:', endDate.toISOString());
  console.log('  Employee preferences count:', employeePreferences.length);
  
  const response = await schedulerApi.generateSchedule(
    startDate.toISOString(),
    endDate.toISOString(),
    settings?.department || 'Akutmottagning',
    gurobiConfig.minStaffPerShift,
    gurobiConfig.minExperiencePerShift,
    gurobiConfig.includeWeekends,
    timestamp || Date.now(),
    employeePreferences
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
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      start_time_type: typeof shift.start_time,
      end_time_type: typeof shift.end_time
    });
    
    return {
      id: uuidv4(),
      employee_id: shift.employee_id,
      date: shift.date, // Include date from Gurobi response
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      is_published: false,
      department: shift.department || 'Akutmottagning'
    };
  });
  
  console.log('🔍 DEBUG: Before saving - sample shift:', convertedSchedule[0]);
  console.log('🔍 DEBUG: Gurobi generated schedule length:', convertedSchedule.length);
  console.log('🔍 DEBUG: All converted shifts:', convertedSchedule.map(s => ({
    employee_id: s.employee_id,
    start_time: s.start_time,
    shift_type: s.shift_type
  })));
  
  console.log(`✅ Gurobi generated ${convertedSchedule.length} shifts for next month`);
  console.log(`📈 Coverage: ${response.coverage_stats?.coverage_percentage || 0}%`);
  console.log(`⚖️ Fairness range: ${response.fairness_stats?.shift_distribution_range || 0} shifts`);
  
  onProgress?.('🎯 Gurobi optimization complete!', 100);
  
  const finalResult = {
    schedule: convertedSchedule, // Use Gurobi result directly without deduplication
    staffingIssues: [], // Gurobi should minimize these
    coverage_stats: response.coverage_stats,
    fairness_stats: response.fairness_stats
  };
  
  console.log('🔍 DEBUG: Final result from generateScheduleForNextMonth:', finalResult);
  console.log('🔍 DEBUG: Final result schedule length:', finalResult.schedule.length);
  
  return finalResult;
};
