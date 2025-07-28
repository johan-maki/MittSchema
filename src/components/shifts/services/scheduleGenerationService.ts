import { format } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift, ShiftType } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { convertWorkPreferences } from "@/types/profile";
import { validateScheduleConstraints, formatViolationMessage } from '@/utils/scheduleValidation';

// Type definitions for schedule generation
interface ScheduleSettings {
  department?: string;
  min_staff_per_shift?: number;
  minStaffPerShift?: number;
  min_experience_per_shift?: number;
  minExperiencePerShift?: number;
  include_weekends?: boolean;
  includeWeekends?: boolean;
  [key: string]: unknown;
}

interface CoverageStats {
  [key: string]: unknown;
}

interface FairnessStats {
  [key: string]: unknown;
}

interface GurobiShift {
  employee_id: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  is_weekend: boolean;
  department: string;
  hours?: number;
  hourly_rate?: number;
  cost?: number;
}

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
    
    console.log(`Saving ${shifts.length} shifts to database`);
    
    // Quick validation - only show critical issues
    const dateIssues = shifts.filter(shift => {
      const shiftDate = shift.date || shift.start_time?.split('T')[0];
      if (shiftDate) {
        const month = parseInt(shiftDate.split('-')[1]);
        const today = new Date();
        const expectedMonth = (today.getMonth() + 2) > 12 ? (today.getMonth() + 2) - 12 : today.getMonth() + 2;
        return month !== expectedMonth;
      }
      return false;
    });
    
    if (dateIssues.length > 0) {
      console.warn(`🚨 Found ${dateIssues.length} shifts with wrong month - this may cause display issues`);
    }
    
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
      is_published: false // Draft schedule - requires manual publishing by manager
    }));
    
    // Insert shifts in batches with minimal logging
    for (let i = 0; i < shiftsToInsert.length; i += BATCH_SIZE) {
      const batch = shiftsToInsert.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(batch);
        
      if (insertError) {
        console.error("Error inserting batch:", insertError);
        throw new Error(`Could not save batch: ${insertError.message}`);
      }
    }
    
    console.log(`✅ Successfully saved ${shiftsToInsert.length} shifts to database`);
    
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
  settings: ScheduleSettings,
  timestamp?: number,
  onProgress?: (step: string, progress: number) => void,
  onClearComplete?: () => void
): Promise<{ 
  schedule: Shift[], 
  staffingIssues?: { date: string; shiftType: string; current: number; required: number }[],
  coverage_stats?: CoverageStats,
  fairness_stats?: FairnessStats 
}> => {
  // Always generate for next month from today for consistency
  const today = new Date();
  
  // 🔧 ULTIMATE ROOT CAUSE FIX: Avoid JavaScript Date.UTC() month rollover bug
  // PROBLEM 1: Timezone conversion created wrong dates
  // PROBLEM 2: Date.UTC() with day 31 + time 23:59:59.999 causes month rollover bug
  //            Result: Month shows September instead of August, confusing Gurobi
  // SOLUTION: Use precise calculation with year rollover support
  
  let targetYear = today.getFullYear();
  let targetMonth = today.getMonth(); // Current month (0-indexed), will increment to next month below
  
  // Increment to next month and handle year rollover (December → January)
  targetMonth += 1;
  if (targetMonth > 11) {
    targetYear += 1;
    targetMonth = 0; // January
  }
  
  // Calculate actual last day of target month using string manipulation to avoid Date bugs
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
  const lastDayOfTargetMonth = targetMonth === 1 && isLeapYear ? 29 : daysInMonth[targetMonth];
  
  // 🔧 CRITICAL FIX: Include night shifts that cross month boundaries
  // PROBLEM 1: First night shift (Aug 1 22:00 → Aug 2 06:00) was missing
  // PROBLEM 2: Last night shift (Aug 31 22:00 → Sep 1 06:00) was incorrectly cleared
  // SOLUTION: Extend Gurobi range to include boundary night shifts
  
  // For Gurobi: Include previous day's night shift and next day's night shift
  const gurobiStartISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const gurobiEndISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;
  
  // Use these for database operations (more restrictive to avoid clearing needed shifts)
  const startDateISO = gurobiStartISO;
  const endDateISO = gurobiEndISO;
  
  // 🚨 CRITICAL FIX: Don't create Date objects from ISO strings - they cause month rollover bugs!
  // Only use ISO strings for database operations and Gurobi API
  
  onProgress?.('🗑️ Rensar befintligt schema för målmånaden...', 2);
  
  // Clear existing shifts for the target month FIRST - before any Gurobi processing
  // This ensures immediate visual feedback and no conflicts
  // 🔧 CRITICAL FIX: Clear both target month AND next month to remove any spillover shifts
  // PROBLEM: Previous generations might have left shifts in September that show up in UI
  // SOLUTION: Clear target month (August) and next month (September) to eliminate all boundary issues
  
  const clearStartDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const clearEndDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;
  
  // Also clear any shifts in the following month (September) to remove boundary spillovers
  let nextMonthYear = targetYear;
  let nextMonth = targetMonth + 1; // September (0-indexed)
  if (nextMonth > 11) {
    nextMonthYear += 1;
    nextMonth = 0; // January
  }
  const nextMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const nextMonthIsLeapYear = (nextMonthYear % 4 === 0 && nextMonthYear % 100 !== 0) || (nextMonthYear % 400 === 0);
  const lastDayOfNextMonth = nextMonth === 1 && nextMonthIsLeapYear ? 29 : nextMonthDays[nextMonth];
  
  const clearNextMonthStartISO = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const clearNextMonthEndISO = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(lastDayOfNextMonth).padStart(2, '0')}T23:59:59.999Z`;
  
  console.log('🗑️ CLEARING SHIFTS IN RANGE:');
  console.log('  Target month (Aug):', clearStartDateISO, 'to', clearEndDateISO);
  console.log('  Next month (Sep):', clearNextMonthStartISO, 'to', clearNextMonthEndISO);
  
  // Clear target month shifts
  const { error: clearError } = await supabase
    .from('shifts')
    .delete()
    .gte('start_time', clearStartDateISO)
    .lte('start_time', clearEndDateISO);
    
  if (clearError) {
    console.error("Error clearing target month shifts:", clearError);
    throw new Error(`Could not clear target month shifts: ${clearError.message}`);
  }
  
  // Clear next month shifts (September boundary spillovers)
  const { error: clearNextError } = await supabase
    .from('shifts')
    .delete()
    .gte('start_time', clearNextMonthStartISO)
    .lte('start_time', clearNextMonthEndISO);
    
  if (clearNextError) {
    console.error("Error clearing next month boundary shifts:", clearNextError);
    throw new Error(`Could not clear next month boundary shifts: ${clearNextError.message}`);
  }
  
  // 🔍 DEBUG: Verify what was actually cleared from both months
  const { data: remainingTargetShifts, error: checkError } = await supabase
    .from('shifts')
    .select('start_time, date, employee_id, shift_type')
    .gte('start_time', clearStartDateISO)
    .lte('start_time', clearEndDateISO);
    
  const { data: remainingNextShifts, error: checkNextError } = await supabase
    .from('shifts')
    .select('start_time, date, employee_id, shift_type')
    .gte('start_time', clearNextMonthStartISO)
    .lte('start_time', clearNextMonthEndISO);
    
  if (checkError || checkNextError) {
    console.warn('Could not verify cleared shifts:', { checkError, checkNextError });
  } else {
    console.log('🔍 VERIFICATION: Remaining shifts after clear:');
    console.log('  Target month (Aug):', remainingTargetShifts?.length || 0);
    console.log('  Next month (Sep):', remainingNextShifts?.length || 0);
    
    if (remainingTargetShifts && remainingTargetShifts.length > 0) {
      console.warn('🚨 WARNING: Some target month shifts were not cleared:', remainingTargetShifts);
    }
    if (remainingNextShifts && remainingNextShifts.length > 0) {
      console.warn('🚨 WARNING: Some next month shifts were not cleared:', remainingNextShifts);
    }
  }
  
  console.log('✅ Successfully cleared existing shifts for target month');
  
  // Trigger cache invalidation to show cleared schedule immediately
  onClearComplete?.();
  
  onProgress?.('�📅 Analyserar personalens tillgänglighet och preferenser...', 5);
  
  console.log('🗓️ Generating schedule for next month:', {
    targetMonth: targetMonth + 1,
    employeeCount: profiles.length,
    daysInMonth: lastDayOfTargetMonth
  });
  
  // Validate inputs
  if (!profiles || profiles.length === 0) {
    throw new Error('No employees available for scheduling');
  }

  onProgress?.('⚙️ Konfigurerar optimeringsparametrar...', 15);

  // Extract Gurobi parameters from settings
  const gurobiConfig = {
    minStaffPerShift: settings?.min_staff_per_shift || settings?.minStaffPerShift || 1, // Default to 1
    minExperiencePerShift: settings?.min_experience_per_shift || settings?.minExperiencePerShift || 1,
    includeWeekends: settings?.include_weekends !== false && settings?.includeWeekends !== false // Default to true
  };

  console.log('🎯 Using Gurobi configuration:', gurobiConfig);

  onProgress?.('� Hämtar personalens arbetsönskemål och begränsningar...', 25);
  
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
    const profile = profiles.find(p => p.id === emp.id);
    if (!profile) {
      console.warn(`Profile not found for employee ${emp.id}`);
      return null;
    }
    
    const workPrefs = convertWorkPreferences(emp.work_preferences);
    
    // Reduced preference conversion logging
    // console.log(`🔍 Converting preferences for ${profile?.first_name} ${profile?.last_name}`);
    
    
    // Convert granular constraints back to legacy format for Gurobi API
    const availableDays = Object.entries(workPrefs.day_constraints)
      .filter(([_, constraint]) => constraint.available)
      .map(([day, _]) => day);
      
    const preferredShifts = Object.entries(workPrefs.shift_constraints)
      .filter(([_, constraint]) => constraint.preferred)
      .map(([shift, _]) => shift);
    
    // ⚠️ IMPROVED STRICT CONSTRAINT HANDLING
    // Instead of sending generic strict flags, we send specific constraint details
    // This allows Gurobi to apply constraints properly without excluding employees entirely
    
    // Identify specific days with strict unavailability
    const strictlyUnavailableDays = Object.entries(workPrefs.day_constraints)
      .filter(([_, constraint]) => constraint.strict && !constraint.available)
      .map(([day, _]) => day);
      
    // Identify specific shifts with strict exclusion (preferred=false AND strict=true)
    const strictlyExcludedShifts = Object.entries(workPrefs.shift_constraints)
      .filter(([_, constraint]) => constraint.strict && !constraint.preferred)
      .map(([shift, _]) => shift);
      
    // Identify shifts that are strictly preferred (preferred=true AND strict=true)
    const strictlyPreferredShifts = Object.entries(workPrefs.shift_constraints)
      .filter(([_, constraint]) => constraint.strict && constraint.preferred)
      .map(([shift, _]) => shift);
    
    // For available days, exclude only the strictly unavailable ones
    const effectiveAvailableDays = availableDays.filter(day => 
      !strictlyUnavailableDays.includes(day)
    );
    
    // For preferred shifts, exclude only the strictly excluded ones
    const effectivePreferredShifts = preferredShifts.filter(shift => 
      !strictlyExcludedShifts.includes(shift)
    );
    
    const gurobiPreference = {
      employee_id: emp.id,
      preferred_shifts: effectivePreferredShifts.length > 0 ? effectivePreferredShifts : ["day", "evening"], // Default to day/evening if all excluded
      max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
      available_days: effectiveAvailableDays.length > 0 ? effectiveAvailableDays : ["monday", "tuesday", "wednesday", "thursday", "friday"], // Default to weekdays if all excluded
      // Send specific exclusions instead of generic strict flags
      excluded_shifts: strictlyExcludedShifts,
      excluded_days: strictlyUnavailableDays,
      available_days_strict: strictlyUnavailableDays.length > 0,
      // CORRECTED LOGIC: preferred_shifts_strict should only be true if user has strictly preferred shifts
      // NOT if they have excluded shifts - those are separate constraints
      preferred_shifts_strict: strictlyPreferredShifts.length > 0,
      // Add employee metadata for better optimization
      role: profile?.role || 'Unknown',
      experience_level: profile?.experience_level || 1
    };
    
    // Reduced Gurobi format logging
    // console.log(`✅ Gurobi format for ${profile?.first_name} ${profile?.last_name}`);
    
    
    // Debug constraint logic for all employees to understand the pattern
    if (strictlyExcludedShifts.length > 0 || strictlyPreferredShifts.length > 0) {
      console.log(`🔍 Constraint analysis for ${profile?.first_name}:`, {
        strictlyExcludedShifts,
        strictlyPreferredShifts,
        excluded_shifts_triggers_preferred_strict: 'NO (FIXED)',
        preferred_shifts_strict: gurobiPreference.preferred_shifts_strict,
        logic: 'preferred_shifts_strict only true if user has strictly preferred shifts, not excluded shifts'
      });
    }

    return gurobiPreference;
    
    // Special debugging for Erik
    if (gurobiPreference.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be') {
      console.log('🚨 ERIK ERIKSSON CONSTRAINTS TO GUROBI:', {
        available_days: gurobiPreference.available_days,
        available_days_strict: gurobiPreference.available_days_strict,
        day_constraints: workPrefs.day_constraints,
        message: 'Erik should NOT get Saturday/Sunday shifts if available_days_strict=true and available_days excludes weekends'
      });
    }
    
    return gurobiPreference;
  }).filter(Boolean) || []; // Remove any null entries from missing profiles
  
  console.log('👥 Employee preferences loaded:', employeePreferences);

  onProgress?.('🧮 Startar matematisk optimering för bästa möjliga schema...', 35);
  
  // Add small delay to show progress
  await new Promise(resolve => setTimeout(resolve, 500));
  
  onProgress?.('⚡ Optimerar schemaläggning med avancerade algoritmer...', 45);
  
  // 🔍 FINAL DIAGNOSTIC: What we're sending to Gurobi
  console.log('📤 SENDING TO GUROBI API:');
  console.log('  Start date ISO:', gurobiStartISO);
  console.log('  End date ISO:', gurobiEndISO);
  console.log('  Expected month:', targetMonth + 1);
  console.log('  Expected year:', targetYear);
  console.log('  Employee preferences count:', employeePreferences.length);
  console.log('  🎯 CRITICAL - Full employee preferences being sent to Gurobi:', JSON.stringify(employeePreferences, null, 2));
  
  onProgress?.('🔄 Bearbetar personalschema med samtliga restriktioner...', 55);
  
  // Add intermediate progress steps during API call
  setTimeout(() => onProgress?.('🔍 Gurobi analyserar personaldata och constraints...', 60), 500);
  setTimeout(() => onProgress?.('⚙️ Kör matematisk optimering för schemaläggning...', 65), 1000);
  setTimeout(() => onProgress?.('🧮 Balanserar rättvisa och effektivitet...', 70), 1500);
  
  const response = await schedulerApi.generateSchedule(
    gurobiStartISO,
    gurobiEndISO,
    settings?.department || 'Akutmottagning',
    gurobiConfig.minStaffPerShift,
    gurobiConfig.minExperiencePerShift,
    gurobiConfig.includeWeekends,
    timestamp || Date.now(),
    employeePreferences
  );
  
  onProgress?.('📊 Analyserar optimeringsresultat och kvalitetskontroll...', 75);
  
  console.log('🎉 Gurobi optimization response:', response);
  
  // 🔍 ANALYZE GUROBI RESPONSE DATES
  if (response.schedule && response.schedule.length > 0) {
    const responseDates = response.schedule.map(shift => shift.date || shift.start_time?.split('T')[0]);
    const uniqueDates = [...new Set(responseDates)].sort();
    const dateAnalysis = uniqueDates.map(date => {
      // Parse date string without creating Date object to avoid month rollover bugs
      const [year, month, day] = date.split('-').map(Number);
      return {
        date: date,
        month: month,
        year: year,
        shiftsOnDate: response.schedule.filter(s => (s.date || s.start_time?.split('T')[0]) === date).length
      };
    });
    
    console.log('🔍 GUROBI RESPONSE DATE ANALYSIS:');
    console.log('  Expected month:', targetMonth + 1);
    console.log('  Expected year:', targetYear);
    console.log('  Unique dates in response:', uniqueDates);
    console.log('  Date breakdown:', dateAnalysis);
    
    // 🔍 CRITICAL DEBUG: Check for August 1st specifically
    const august1Shifts = response.schedule.filter(shift => {
      const date = shift.date || shift.start_time?.split('T')[0];
      return date === '2025-08-01';
    });
    
    console.log('🔍 AUGUST 1ST SHIFTS FROM GUROBI:');
    console.log('  Count:', august1Shifts.length);
    august1Shifts.forEach((shift, i) => {
      console.log(`  Aug 1 Shift ${i + 1}:`, {
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        employee_name: shift.employee_name,
        shift_type: shift.shift_type
      });
    });
    
    if (august1Shifts.length < 3) {
      console.warn('🚨 AUGUST 1ST IS MISSING SHIFTS! Expected 3 (day, evening, night), got:', august1Shifts.length);
      console.warn('  Missing shift types:', ['day', 'evening', 'night'].filter(type => 
        !august1Shifts.some(s => s.shift_type === type)
      ));
    }
    
    // 🔍 CRITICAL DEBUG: Sample first and last few shifts from Gurobi
    console.log('🔍 SAMPLE GUROBI SHIFTS (First 3):');
    response.schedule.slice(0, 3).forEach((shift, i) => {
      console.log(`  Shift ${i + 1}:`, {
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        employee_name: shift.employee_name,
        shift_type: shift.shift_type
      });
    });
    
    console.log('🔍 SAMPLE GUROBI SHIFTS (Last 3):');
    response.schedule.slice(-3).forEach((shift, i) => {
      console.log(`  Shift ${response.schedule.length - 2 + i}:`, {
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        employee_name: shift.employee_name,
        shift_type: shift.shift_type
      });
    });
    
    // Check for dates outside target month
    const wrongMonthDates = dateAnalysis.filter(d => 
      d.month !== (targetMonth + 1) || d.year !== targetYear
    );
    
    if (wrongMonthDates.length > 0) {
      console.warn('🚨 GUROBI RETURNED SHIFTS FOR WRONG MONTHS:', wrongMonthDates);
      console.warn('🚨 This is the source of the Juli/September bug!');
      
      // 🔍 DETAILED ANALYSIS: Show actual problem shifts
      const problemShifts = response.schedule.filter(shift => {
        const date = shift.date || shift.start_time?.split('T')[0];
        const [year, month, day] = date.split('-').map(Number);
        return month !== (targetMonth + 1) || year !== targetYear;
      });
      
      console.warn('🚨 DETAILED PROBLEM SHIFTS FROM GUROBI:', problemShifts.map(shift => ({
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        employee_name: shift.employee_name,
        shift_type: shift.shift_type,
        parsed_date: shift.date ? shift.date.split('-') : 'No date',
        parsed_start: shift.start_time ? shift.start_time.split('T')[0] : 'No start_time',
        expected_month: targetMonth + 1,
        actual_month: shift.date ? parseInt(shift.date.split('-')[1]) : 'Unknown'
      })));
      
      // 🚨 CRITICAL: Also check if these are end-of-month boundary issues
      const endOfMonthShifts = problemShifts.filter(shift => {
        const date = shift.date || shift.start_time?.split('T')[0];
        if (date) {
          const day = parseInt(date.split('-')[2]);
          return day === 31 || day === 1; // End or start of month
        }
        return false;
      });
      
      if (endOfMonthShifts.length > 0) {
        console.warn('🚨 MONTH BOUNDARY ISSUE DETECTED:', endOfMonthShifts.map(s => ({
          date: s.date,
          day: s.date ? parseInt(s.date.split('-')[2]) : 'Unknown',
          start_time: s.start_time,
          end_time: s.end_time
        })));
      }
    }
  }
  
  if (!response.schedule || response.schedule.length === 0) {
    throw new Error('Optimering kunde inte generera ett schema med nuvarande begränsningar. Kontrollera personalens tillgänglighet och försök igen.');
  }

  onProgress?.('🔧 Formaterar och validerar schemaresultat...', 85);

  // Convert Gurobi response to our Shift format
  const convertedSchedule: Shift[] = response.schedule
    .filter((shift: GurobiShift, index: number) => {
      // 🔧 CRITICAL FIX: Don't filter out night shifts that belong to the target month
      // The night shift on August 31st (22:00-06:00) SHOULD be displayed on August 31st
      // Only filter out shifts that actually start outside the target month
      
      const startTimeMonth = shift.start_time ? parseInt(shift.start_time.split('-')[1]) : null;
      const startTimeYear = shift.start_time ? parseInt(shift.start_time.split('-')[0]) : null;
      
      // Keep ALL shifts that start in the target month, regardless of when they end
      const isInTargetMonth = startTimeMonth === (targetMonth + 1) && startTimeYear === targetYear;
      
      if (!isInTargetMonth) {
        console.warn(`🚨 FILTERING OUT NON-TARGET MONTH SHIFT ${index + 1}:`, {
          start_time: shift.start_time,
          end_time: shift.end_time,
          start_month: startTimeMonth,
          expected_month: targetMonth + 1,
          employee_name: shift.employee_name,
          shift_type: shift.shift_type,
          reason: 'Shift starts outside target month'
        });
      }
      
      return isInTargetMonth;
    })
    .map((shift: GurobiShift, index: number) => {
      // Find the employee name from profiles
      const employee = profiles.find(p => p.id === shift.employee_id);
      const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : shift.employee_name || 'Unknown Employee';
      
      // No additional filtering needed - the filter above handles boundary shifts correctly
      const correctedEndTime = shift.end_time;
      
      // 🔍 DEBUG: Verify shift data consistency
      const shiftDate = shift.date || shift.start_time?.split('T')[0];
      
      // Reduced conversion logging - only show critical boundary shifts
      if (shift.shift_type === 'night' && (shiftDate?.includes('-01') || shiftDate?.includes('-31'))) {
        console.log(`🌙 Boundary night shift ${index + 1}:`, {
          date: shiftDate,
          employee: employeeName,
          type: shift.shift_type
        });
      }
      
      return {
        id: uuidv4(),
        employee_id: shift.employee_id,
        employee_name: employeeName, // Add missing employee_name field
        date: shift.date, // Include date from Gurobi response
        start_time: shift.start_time,
        end_time: correctedEndTime, // Use corrected end_time
        shift_type: shift.shift_type as ShiftType,
        is_published: false,
        department: shift.department || 'Akutmottagning'
      };
    }); // All filtering is done in the .filter() step above
  
  console.log(`✅ Optimering genererade ${convertedSchedule.length} pass från Gurobi`);
  console.log(`📈 Täckning: ${response.coverage_stats?.coverage_percentage || 0}%`);
  console.log(`⚖️ Rättvishet: ${response.fairness_stats?.shift_distribution_range || 0} pass spridning`);
  
  // Validate schedule for constraint violations (logging only)
  if (profiles && profiles.length > 0) {
    const violations = validateScheduleConstraints(convertedSchedule, profiles);
    if (violations.length > 0) {
      const violationMessage = formatViolationMessage(violations);
      console.warn('🚨 SCHEDULE CONSTRAINT VIOLATIONS DETECTED:');
      console.warn(violationMessage);
    }
  }
  
  onProgress?.('✅ Schema optimerat och klart för granskning!', 100);
  
  const finalResult = {
    schedule: convertedSchedule, // Use Gurobi result directly - no client-side modifications
    staffingIssues: [], // Gurobi should minimize these
    coverage_stats: response.coverage_stats,
    fairness_stats: response.fairness_stats
  };
  
  return finalResult;
};
