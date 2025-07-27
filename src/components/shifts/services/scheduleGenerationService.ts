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
      is_published: false // Draft schedule - requires manual publishing by manager
    }));
    
    // Clear existing shifts for the target month first (both published and unpublished)
    // This ensures we don't have conflicts when regenerating a schedule
    const startOfMonth = new Date(shifts[0]?.start_time || new Date());
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    const { error: clearError } = await supabase
      .from('shifts')
      .delete()
      .gte('start_time', startOfMonth.toISOString())
      .lte('start_time', endOfMonth.toISOString());
      
    if (clearError) {
      console.error("Error clearing existing shifts for target month:", clearError);
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
  settings: ScheduleSettings,
  timestamp?: number,
  onProgress?: (step: string, progress: number) => void
): Promise<{ 
  schedule: Shift[], 
  staffingIssues?: { date: string; shiftType: string; current: number; required: number }[],
  coverage_stats?: CoverageStats,
  fairness_stats?: FairnessStats 
}> => {
  // Always generate for next month from today for consistency
  const today = new Date();
  const targetMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const startDate = new Date(targetMonth);
  startDate.setHours(0, 0, 0, 0);
  
  // Last day of next month
  const endDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  onProgress?.('📅 Analyserar personalens tillgänglighet och preferenser...', 5);
  
  console.log('🗓️ Generating schedule for next month with Gurobi:', {
    today: today.toISOString().split('T')[0],
    targetMonth: targetMonth.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    currentViewParam: currentDate.toISOString().split('T')[0],
    employeeCount: profiles.length,
    daysInMonth: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
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
    
    console.log(`🔍 Converting preferences for ${profile?.first_name} ${profile?.last_name} (${emp.id}):`, {
      rawPrefs: emp.work_preferences,
      convertedPrefs: workPrefs
    });
    
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
    
    console.log(`✅ Gurobi format for ${profile?.first_name} ${profile?.last_name}:`, gurobiPreference);
    
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
  console.log('  Start date:', startDate.toISOString());
  console.log('  End date:', endDate.toISOString());
  console.log('  Employee preferences count:', employeePreferences.length);
  console.log('  🎯 CRITICAL - Full employee preferences being sent to Gurobi:', JSON.stringify(employeePreferences, null, 2));
  
  onProgress?.('🔄 Bearbetar personalschema med samtliga restriktioner...', 55);
  
  // Add intermediate progress steps during API call
  setTimeout(() => onProgress?.('🔍 Gurobi analyserar personaldata och constraints...', 60), 500);
  setTimeout(() => onProgress?.('⚙️ Kör matematisk optimering för schemaläggning...', 65), 1000);
  setTimeout(() => onProgress?.('🧮 Balanserar rättvisa och effektivitet...', 70), 1500);
  
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
  
  onProgress?.('📊 Analyserar optimeringsresultat och kvalitetskontroll...', 75);
  
  console.log('🎉 Gurobi optimization response:', response);
  
  if (!response.schedule || response.schedule.length === 0) {
    throw new Error('Optimering kunde inte generera ett schema med nuvarande begränsningar. Kontrollera personalens tillgänglighet och försök igen.');
  }

  onProgress?.('🔧 Formaterar och validerar schemaresultat...', 85);

  // Convert Gurobi response to our Shift format
  const convertedSchedule: Shift[] = response.schedule.map((shift: GurobiShift, index: number) => {
    // Find the employee name from profiles
    const employee = profiles.find(p => p.id === shift.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : shift.employee_name || 'Unknown Employee';
    
    return {
      id: uuidv4(),
      employee_id: shift.employee_id,
      employee_name: employeeName, // Add missing employee_name field
      date: shift.date, // Include date from Gurobi response
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type as ShiftType,
      is_published: false,
      department: shift.department || 'Akutmottagning'
    };
  });
  
  console.log(`✅ Optimering genererade ${convertedSchedule.length} pass för nästa månad`);
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
