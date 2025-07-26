
import type { Json } from "@/integrations/supabase/types";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  experience_level: number;
  hourly_rate?: number; // SEK per hour
  created_at: string;
  updated_at: string;
  work_preferences?: WorkPreferences;
}

export type NewProfile = {
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  experience_level: number;
  hourly_rate?: number; // SEK per hour
};

export type InsertProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  experience_level?: number;
  hourly_rate?: number; // SEK per hour
};

export type DayConstraint = {
  available: boolean;
  strict: boolean; // true = hard constraint, false = soft constraint
};

export type ShiftConstraint = {
  preferred: boolean;
  strict: boolean; // true = hard constraint, false = soft constraint
};

export interface WorkPreferences {
  max_shifts_per_week: number;
  // Granular constraints per day
  day_constraints: {
    monday: DayConstraint;
    tuesday: DayConstraint;
    wednesday: DayConstraint;
    thursday: DayConstraint;
    friday: DayConstraint;
    saturday: DayConstraint;
    sunday: DayConstraint;
  };
  // Granular constraints per shift type
  shift_constraints: {
    day: ShiftConstraint;
    evening: ShiftConstraint;
    night: ShiftConstraint;
  };
  // Legacy fields for backward compatibility - will be derived from granular constraints
  preferred_shifts?: ("day" | "evening" | "night")[];
  available_days?: string[];
  available_days_strict?: boolean;
  preferred_shifts_strict?: boolean;
}

export type DatabaseProfile = Omit<Profile, 'work_preferences'> & {
  work_preferences: Json;
};

// Helper function to convert database profile to our internal Profile type
export function convertDatabaseProfile(dbProfile: DatabaseProfile): Profile {
  console.log("🔧 Converting database profile:", dbProfile);
  const converted = {
    ...dbProfile,
    work_preferences: convertWorkPreferences(dbProfile.work_preferences),
  };
  console.log("🔧 Converted to profile:", converted);
  return converted;
}

// Helper function to safely convert Json to WorkPreferences
export function convertWorkPreferences(json: Json): WorkPreferences {
  const defaultPreferences: WorkPreferences = {
    max_shifts_per_week: 5,
    day_constraints: {
      monday: { available: true, strict: false },
      tuesday: { available: true, strict: false },
      wednesday: { available: true, strict: false },
      thursday: { available: true, strict: false },
      friday: { available: true, strict: false },
      saturday: { available: true, strict: false },
      sunday: { available: true, strict: false },
    },
    shift_constraints: {
      day: { preferred: true, strict: false },
      evening: { preferred: true, strict: false },
      night: { preferred: true, strict: false },
    },
  };

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaultPreferences;
  }

  const jsonObj = json as Record<string, unknown>;
  
  // Handle new granular constraint format
  if (jsonObj.day_constraints && jsonObj.shift_constraints) {
    return {
      max_shifts_per_week: typeof jsonObj.max_shifts_per_week === 'number' 
        ? jsonObj.max_shifts_per_week 
        : defaultPreferences.max_shifts_per_week,
      day_constraints: jsonObj.day_constraints as WorkPreferences['day_constraints'] || defaultPreferences.day_constraints,
      shift_constraints: jsonObj.shift_constraints as WorkPreferences['shift_constraints'] || defaultPreferences.shift_constraints,
    };
  }
  
  // Handle legacy format and convert to new granular format
  const legacyAvailableDays = Array.isArray(jsonObj.available_days) 
    ? jsonObj.available_days.map(String)
    : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
  const legacyPreferredShifts = Array.isArray(jsonObj.preferred_shifts) 
    ? jsonObj.preferred_shifts.filter((shift): shift is "day" | "evening" | "night" => 
        ["day", "evening", "night"].includes(String(shift)))
    : ["day", "evening", "night"];
    
  const legacyDaysStrict = typeof jsonObj.available_days_strict === 'boolean' 
    ? jsonObj.available_days_strict 
    : false;
    
  const legacyShiftsStrict = typeof jsonObj.preferred_shifts_strict === 'boolean' 
    ? jsonObj.preferred_shifts_strict 
    : false;

  // Convert legacy to granular format
  const converted: WorkPreferences = {
    max_shifts_per_week: typeof jsonObj.max_shifts_per_week === 'number' 
      ? jsonObj.max_shifts_per_week 
      : defaultPreferences.max_shifts_per_week,
    day_constraints: {
      monday: { available: legacyAvailableDays.includes('monday'), strict: legacyDaysStrict },
      tuesday: { available: legacyAvailableDays.includes('tuesday'), strict: legacyDaysStrict },
      wednesday: { available: legacyAvailableDays.includes('wednesday'), strict: legacyDaysStrict },
      thursday: { available: legacyAvailableDays.includes('thursday'), strict: legacyDaysStrict },
      friday: { available: legacyAvailableDays.includes('friday'), strict: legacyDaysStrict },
      saturday: { available: legacyAvailableDays.includes('saturday'), strict: legacyDaysStrict },
      sunday: { available: legacyAvailableDays.includes('sunday'), strict: legacyDaysStrict },
    },
    shift_constraints: {
      day: { preferred: legacyPreferredShifts.includes('day'), strict: legacyShiftsStrict },
      evening: { preferred: legacyPreferredShifts.includes('evening'), strict: legacyShiftsStrict },
      night: { preferred: legacyPreferredShifts.includes('night'), strict: legacyShiftsStrict },
    },
  };
  
  return converted;
}
