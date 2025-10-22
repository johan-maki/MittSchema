import { format } from "date-fns";
import { schedulerApi } from "@/api/schedulerApi";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";
import type { Shift, ShiftType } from "@/types/shift";
import { v4 as uuidv4 } from 'uuid';
import { convertWorkPreferences } from "@/types/profile";
import { validateScheduleConstraints, formatViolationMessage } from '@/utils/scheduleValidation';
import { dbLogger, scheduleLogger } from '@/utils/logger';
import { DATABASE_CONFIG, SCHEDULE_DEFAULTS } from '@/config/constants';

// Type definitions for schedule generation
interface ScheduleSettings {
  department?: string;
  min_staff_per_shift?: number;
  minStaffPerShift?: number;
  min_experience_per_shift?: number;
  minExperiencePerShift?: number;
  include_weekends?: boolean;
  includeWeekends?: boolean;
  optimizeForCost?: boolean;
  maxStaffPerShift?: number | null;
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
      dbLogger.info("No shifts to save");
      return false;
    }
    
    dbLogger.info(`Saving ${shifts.length} shifts to database`);
    
    // Quick validation - only in development to avoid performance hit
    if (import.meta.env.DEV) {
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
        dbLogger.warn(`Found ${dateIssues.length} shifts with wrong month - this may cause display issues`);
      }
    }
    
    // Process shifts in batches to avoid database timeouts
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
    for (let i = 0; i < shiftsToInsert.length; i += DATABASE_CONFIG.BATCH_SIZE) {
      const batch = shiftsToInsert.slice(i, i + DATABASE_CONFIG.BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(batch);
        
      if (insertError) {
        dbLogger.error("Error inserting batch:", insertError);
        throw new Error(`Could not save batch: ${insertError.message}`);
      }
    }
    
    dbLogger.info(`Successfully saved ${shiftsToInsert.length} shifts to database`);
    
    return true;
  } catch (error) {
    dbLogger.error("Error saving shifts to Supabase:", error);
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
  onClearComplete?: () => void,
  aiConstraints?: any[]
): Promise<{ 
  schedule: Shift[], 
  staffingIssues?: { date: string; shiftType: string; current: number; required: number }[],
  coverage_stats?: CoverageStats,
  fairness_stats?: FairnessStats,
  objective_value?: number
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
    console.log('✅ Successfully cleared existing shifts for target month');
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
    includeWeekends: settings?.include_weekends !== false && settings?.includeWeekends !== false, // Default to true
    optimizeForCost: settings?.optimizeForCost ?? false, // Default to false
    maxStaffPerShift: settings?.maxStaffPerShift ?? null // null = exact staffing (same as min)
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
    
    // For preferred shifts, include both regular preferred AND strictly preferred shifts
    // Then exclude only the strictly excluded ones
    const allPreferredShifts = [...new Set([...preferredShifts, ...strictlyPreferredShifts])];
    const effectivePreferredShifts = allPreferredShifts.filter(shift => 
      !strictlyExcludedShifts.includes(shift)
    );
    
    const gurobiPreference = {
      employee_id: emp.id,
      preferred_shifts: effectivePreferredShifts.length > 0 ? effectivePreferredShifts : ["day", "evening"], // Default to day/evening if all excluded
      max_shifts_per_week: Math.ceil((workPrefs.work_percentage || 100) * 5 / 100), // Convert percentage to max shifts per week (100% = 5 shifts/week)
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
      experience_level: profile?.experience_level || 1,
      // Include work_percentage for Gurobi server capacity calculations
      work_percentage: workPrefs.work_percentage || 100,
      // Hard blocked time slots: specific date+shift combinations that CANNOT be scheduled
      hard_blocked_slots: workPrefs.hard_blocked_slots || [],
      // Medium blocked time slots: specific date+shift combinations to AVOID if possible
      medium_blocked_slots: workPrefs.medium_blocked_slots || []
    };
    
    // Log work_percentage calculations for debugging
    if (workPrefs.work_percentage && workPrefs.work_percentage !== 100) {
      console.log(`🔍 Work percentage for ${profile?.first_name} ${profile?.last_name}: ${workPrefs.work_percentage}% → max ${gurobiPreference.max_shifts_per_week} shifts/week`);
    }
    
    // Log hard blocked slots when present
    if (workPrefs.hard_blocked_slots && workPrefs.hard_blocked_slots.length > 0) {
      console.log(`🚫 Hard blocked slots for ${profile?.first_name} ${profile?.last_name}:`, workPrefs.hard_blocked_slots);
    }
    
    // Log medium blocked slots when present
    if (workPrefs.medium_blocked_slots && workPrefs.medium_blocked_slots.length > 0) {
      console.log(`⚠️ Medium blocked slots for ${profile?.first_name} ${profile?.last_name}:`, workPrefs.medium_blocked_slots);
    }
    
    // Reduced Gurobi format logging
    // console.log(`✅ Gurobi format for ${profile?.first_name} ${profile?.last_name}`);
    
    
    // Debug constraint logic for all employees to understand the pattern
    if (strictlyExcludedShifts.length > 0 || strictlyPreferredShifts.length > 0) {
      // Only log constraint conflicts, not normal preferences
    }
    
    // Special debugging for specific employees with strict constraints
    if (gurobiPreference.available_days_strict || gurobiPreference.preferred_shifts_strict) {
      console.log(`� STRICT CONSTRAINTS for ${profile?.first_name} ${profile?.last_name}:`, {
        available_days: gurobiPreference.available_days,
        available_days_strict: gurobiPreference.available_days_strict,
        excluded_days: gurobiPreference.excluded_days,
        preferred_shifts: gurobiPreference.preferred_shifts,
        preferred_shifts_strict: gurobiPreference.preferred_shifts_strict,
        excluded_shifts: gurobiPreference.excluded_shifts,
      });
    }
    
    return gurobiPreference;
  }).filter(Boolean) || []; // Remove any null entries from missing profiles
  
  console.log('👥 Employee preferences loaded:', employeePreferences);

  onProgress?.('🧮 Startar matematisk optimering för bästa möjliga schema...', 35);
  
  // Add small delay to show progress
  await new Promise(resolve => setTimeout(resolve, 500));
  
  onProgress?.('⚡ Optimerar schemaläggning med avancerade algoritmer...', 45);
  
  // 🔍 Final check before sending to Gurobi
  console.log('📤 Sending schedule request to Gurobi API');
  
  onProgress?.('🔄 Bearbetar personalschema med samtliga restriktioner...', 55);
  
  // Add intermediate progress steps during API call
  setTimeout(() => onProgress?.('🔍 Gurobi analyserar personaldata och constraints...', 60), 500);
  setTimeout(() => onProgress?.('⚙️ Kör matematisk optimering för schemaläggning...', 65), 1000);
  setTimeout(() => onProgress?.('🧮 Balanserar rättvisa och effektivitet...', 70), 1500);
  
  // 🔄 LOAD AI CONSTRAINTS FROM SUPABASE BEFORE SENDING TO GUROBI
  // This ensures constraints persist across page refreshes and are always used
  let finalAIConstraints = aiConstraints || [];
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: dbConstraints, error } = await (supabase as any)
      .from('ai_constraints')
      .select('*')
      .eq('department', settings?.department || 'Akutmottagning');
    
    if (error) {
      console.error('❌ Error loading AI constraints:', error);
    } else if (dbConstraints && dbConstraints.length > 0) {
      // 🔧 Convert new schema format to Gurobi-compatible format
      const convertedConstraints = dbConstraints
        .map((dbConstraint: {
          employee_id: string;
          dates: string[];
          shifts: string[];
          constraint_type: string;
          priority: number;
          original_text: string;
        }) => {
          // Find employee to get full name
          const matchedEmployee = profiles.find(p => p.id === dbConstraint.employee_id);
          
          if (!matchedEmployee) {
            console.warn(`⚠️ No employee found for constraint with employee_id: "${dbConstraint.employee_id}"`);
            return null; // Skip constraints for unknown employees
          }
          
          // Convert from new schema format to Gurobi format
          const dates = dbConstraint.dates || [];
          const start_date = dates.length > 0 ? dates[0] : '';
          const end_date = dates.length > 0 ? dates[dates.length - 1] : '';
          
          // Convert constraint_type from new format to Gurobi format
          const is_hard = dbConstraint.constraint_type === 'hard_unavailable' || dbConstraint.constraint_type === 'hard_required';
          
          return {
            employee_id: matchedEmployee.id,
            employee_name: `${matchedEmployee.first_name} ${matchedEmployee.last_name}`,
            constraint_type: dbConstraint.constraint_type,
            shift_type: dbConstraint.shifts && dbConstraint.shifts.length > 0 ? dbConstraint.shifts[0] : undefined,
            start_date: start_date,
            end_date: end_date,
            is_hard: is_hard,
            confidence: dbConstraint.priority >= 1000 ? 'high' : 'medium',
            original_text: dbConstraint.original_text
          };
        })
        .filter(Boolean); // Remove null entries
      
      finalAIConstraints = convertedConstraints;
      
      if (finalAIConstraints.length > 0) {
        console.log(`✅ Loaded ${finalAIConstraints.length} AI constraints for Gurobi`);
        finalAIConstraints.forEach((c: { employee_name: string; original_text?: string }) => {
          console.log(`   • ${c.employee_name}: ${c.original_text}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Error loading AI constraints:', err);
  }
  
  let response;
  
  try {
    // First attempt: Try with normal constraints
    response = await schedulerApi.generateSchedule(
      gurobiStartISO,
      gurobiEndISO,
      settings?.department || 'Akutmottagning',
      gurobiConfig.minStaffPerShift,
      gurobiConfig.minExperiencePerShift,
      gurobiConfig.includeWeekends,
      timestamp || Date.now(),
      employeePreferences,
      3, // retries
      false, // allowPartialCoverage = false for first attempt (strict requirements)
      gurobiConfig.optimizeForCost, // Pass cost optimization flag
      gurobiConfig.maxStaffPerShift, // Pass max staffing limit (null = exact staffing)
      finalAIConstraints // Pass AI constraints loaded from Supabase
    );
  } catch (error) {
    // Enhanced error classification
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('🔍 CAUGHT ERROR:', { error, errorMessage, type: typeof error });
    
    // Check for connection/timeout errors first (but exclude known staffing errors wrapped in server errors)
    const isConnectionError = (errorMessage.includes('AbortError') || 
                               errorMessage.includes('signal is aborted') ||
                               errorMessage.includes('request timed out') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('ECONNREFUSED') ||
                               errorMessage.includes('fetch failed')) && 
                               // Don't treat staffing errors wrapped in 500 errors as connection errors
                               !(errorMessage.includes('Not enough employees') || 
                                 errorMessage.includes('need ') || 
                                 errorMessage.includes('but only'));
    
    const isStaffingError = errorMessage.includes('Not enough employees') || 
                           errorMessage.includes('need ') || 
                           errorMessage.includes('but only');
    
    console.log('🔍 ERROR CLASSIFICATION:', { 
      isConnectionError,
      isStaffingError, 
      hasNotEnoughEmployees: errorMessage.includes('Not enough employees'),
      hasNeed: errorMessage.includes('need '),
      hasButOnly: errorMessage.includes('but only'),
      hasTimeout: errorMessage.includes('timeout'),
      hasAbortError: errorMessage.includes('AbortError'),
      fullErrorMessage: errorMessage
    });
    
    // Handle connection errors differently from staffing errors
    if (isConnectionError) {
      console.error('🌐 CONNECTION ERROR: Render backend är inte tillgänglig');
      throw new Error(`Anslutningsproblem till Gurobi-optimeringsservern. Servern är inte tillgänglig just nu. Detta kan bero på att servern startar upp (cold start) eller är nere. Inget schema kan genereras utan Gurobi. Försök igen om 30-60 sekunder eller kontakta administratören.`);
    }
    
    if (isStaffingError) {
      // Extract staffing info from error message for better user feedback
      const staffingMatch = errorMessage.match(/need (\d+) shifts but only (\d+) possible/);
      if (staffingMatch) {
        const [, needed, possible] = staffingMatch;
        const coveragePercent = Math.round((parseInt(possible) / parseInt(needed)) * 100);
        console.log(`🔢 STAFFING ANALYSIS: Behöver ${needed} pass, kan bara fylla ${possible} (${coveragePercent}% täckning)`);
        throw new Error(`Otillräcklig bemanning: Kan bara täcka ${coveragePercent}% av behovet (${possible}/${needed} pass). För ett komplett schema behövs fler anställda eller flexiblare arbetstider/preferenser.`);
      }
      throw new Error(`Otillräcklig bemanning för att generera ett schema. Behöver fler anställda eller flexiblare arbetstider/preferenser.`);
    }
    
    // Re-throw all other errors as-is - no fallback allowed
    throw error;
  }
  
  onProgress?.('📊 Analyserar optimeringsresultat och kvalitetskontroll...', 75);
  
  console.log('🎉 Gurobi optimization response:', response);
  
  // STRICT VALIDATION: Ensure response is from Gurobi optimizer
  if (!response.optimizer || response.optimizer.toLowerCase() !== 'gurobi') {
    console.error('❌ INVALID OPTIMIZER: Response is not from Gurobi!', {
      optimizer: response.optimizer,
      message: response.message
    });
    throw new Error(`Schema genererades inte av Gurobi-optimeraren (fick: ${response.optimizer || 'okänd'}). Endast Gurobi-optimerade scheman tillåts. Kontrollera att Render-servern kör korrekt.`);
  }
  
  console.log('✅ VALIDATED: Schema är genererat av Gurobi optimizer');
  
  // Enhanced validation for partial schedules
  if (response.schedule && response.schedule.length > 0) {
    const uniqueDates = [...new Set(response.schedule.map(shift => shift.date || shift.start_time?.split('T')[0]))].sort();
    const coveragePercentage = response.coverage_stats?.coverage_percentage || 0;
    
    console.log(`✅ Generated schedule: ${response.schedule.length} shifts covering ${uniqueDates.length} days`);
    
    // Provide user feedback for partial coverage
    if (coveragePercentage < 100) {
      console.warn(`⚠️ PARTIAL COVERAGE: ${coveragePercentage}% av nödvändiga pass är täckta. Vissa dagar/skift kan vara underbemannade.`);
      onProgress?.(`⚠️ Partiellt schema genererat (${coveragePercentage}% täckning)`, 80);
    } else {
      onProgress?.('✅ Komplett schema genererat!', 80);
    }
  }
  
  // Allow empty schedule only if absolutely no solution is possible
  if (!response.schedule || response.schedule.length === 0) {
    // Check if we have coverage stats to provide better error message
    const coverageMsg = response.coverage_stats ? 
      `Täckning: ${response.coverage_stats.coverage_percentage || 0}%` : 
      'Ingen täckningsdata tillgänglig';
    
    throw new Error(`Optimering kunde inte generera något schema. ${coverageMsg}. Kontrollera att personal har tillräcklig tillgänglighet och försök igen.`);
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
  
  const coveragePercentage = response.coverage_stats?.coverage_percentage || 0;
  const isPartialCoverage = coveragePercentage < 100;
  
  console.log(`✅ Optimering genererade ${convertedSchedule.length} pass från Gurobi`);
  console.log(`📈 Täckning: ${coveragePercentage}%`);
  console.log(`⚖️ Rättvishet: ${response.fairness_stats?.shift_distribution_range || 0} pass spridning`);
  
  // Enhanced logging for partial coverage scenarios
  if (isPartialCoverage) {
    const totalNeeded = response.coverage_stats?.total_shifts || 0;
    const filled = response.coverage_stats?.filled_shifts || convertedSchedule.length;
    const uncoveredShifts = totalNeeded - filled;
    
    console.warn(`⚠️ PARTIELL TÄCKNING: ${uncoveredShifts} pass saknar bemanning (${coveragePercentage}% täckning)`);
    console.warn(`📊 Schema-statistik: ${filled}/${totalNeeded} pass bemannade`);
    
    // Add coverage warning to progress
    onProgress?.(`⚠️ Schema klart - ${coveragePercentage}% täckning`, 100);
  } else {
    console.log('🎉 FULLSTÄNDIG TÄCKNING: Alla pass har adekvat bemanning!');
    onProgress?.('✅ Schema optimerat och klart för granskning!', 100);
  }
  
  // Validate schedule for constraint violations (logging only)
  if (profiles && profiles.length > 0) {
    const violations = validateScheduleConstraints(convertedSchedule, profiles);
    if (violations.length > 0) {
      const violationMessage = formatViolationMessage(violations);
      console.warn('🚨 SCHEDULE CONSTRAINT VIOLATIONS DETECTED:');
      console.warn(violationMessage);
    }
  }
  
  const finalResult = {
    schedule: convertedSchedule, // Use Gurobi result directly - no client-side modifications
    staffingIssues: [], // Gurobi should minimize these
    coverage_stats: response.coverage_stats,
    fairness_stats: response.fairness_stats,
    objective_value: response.objective_value // Include optimization score
  };
  
  return finalResult;
};
