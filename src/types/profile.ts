
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
  work_percentage?: number; // 0-100, represents percentage of full-time
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
  work_percentage?: number; // 0-100, represents percentage of full-time
};

export type DayConstraint = {
  available: boolean;
  strict: boolean; // true = hard constraint, false = soft constraint
};

export type ShiftConstraint = {
  preferred: boolean;
  strict: boolean; // true = hard constraint, false = soft constraint
};

// Hard blocked time slot - employee absolutely cannot work this specific time
export type HardBlockedSlot = {
  date: string; // ISO date string (YYYY-MM-DD)
  shift_types: ('day' | 'evening' | 'night' | 'all_day')[]; // Which shifts on this date are blocked
};

// Medium blocked time slot - employee prefers not to work but can if needed
// Stronger than soft preferences but weaker than hard constraints
export type MediumBlockedSlot = {
  date: string; // ISO date string (YYYY-MM-DD)
  shift_types: ('day' | 'evening' | 'night' | 'all_day')[]; // Which shifts on this date are avoided if possible
};

export interface WorkPreferences {
  work_percentage: number; // 0-100, represents percentage of full-time (5% increments)
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
  // Hard blocked time slots (max 3 slots) - ABSOLUTE: Cannot work
  hard_blocked_slots?: HardBlockedSlot[];
  // Medium blocked time slots (max 3 slots) - PREFERENCE: Avoid if possible
  medium_blocked_slots?: MediumBlockedSlot[];
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
export const convertDatabaseProfile = (dbProfile: DatabaseProfile): Profile => {
  const workPreferences = convertWorkPreferences(dbProfile.work_preferences);
  
  const converted: Profile = {
    id: dbProfile.id,
    first_name: dbProfile.first_name,
    last_name: dbProfile.last_name,
    phone: dbProfile.phone || '', // Add phone field with default value
    role: dbProfile.role || 'Unknown',
    department: dbProfile.department || 'Unknown',
    experience_level: dbProfile.experience_level || 1,
    hourly_rate: dbProfile.hourly_rate || 500,
    work_percentage: workPreferences.work_percentage, // Extract work_percentage from work_preferences
    work_preferences: workPreferences,
    created_at: dbProfile.created_at,
    updated_at: dbProfile.updated_at
  };
  
  return converted;
};

// Helper function to safely convert Json to WorkPreferences
export function convertWorkPreferences(json: Json): WorkPreferences {
  const defaultPreferences: WorkPreferences = {
    work_percentage: 100, // Default to 100% (full-time equivalent to 5 days)
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
    hard_blocked_slots: [],
  };

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaultPreferences;
  }

  const jsonObj = json as Record<string, unknown>;
  
  // Handle new granular constraint format (with possible mixed day formats)
  if (jsonObj.day_constraints && jsonObj.shift_constraints) {
    const dayConstraints = jsonObj.day_constraints as Record<string, Record<string, unknown>>;
    const convertedDayConstraints: Record<string, DayConstraint> = {};
    
    // Handle each day, supporting both old {available, strict} and new {day, evening, night} formats
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    
    for (const day of days) {
      const dayData = dayConstraints[day];
      
      if (!dayData) {
        // Default if no data for this day
        convertedDayConstraints[day] = { available: true, strict: false };
      } else if (typeof dayData.available === 'boolean') {
        // Old format: {available: boolean, strict: boolean}
        convertedDayConstraints[day] = {
          available: dayData.available,
          strict: typeof dayData.strict === 'boolean' ? dayData.strict : false
        };
      } else if (typeof dayData.day === 'boolean' || typeof dayData.evening === 'boolean' || typeof dayData.night === 'boolean') {
        // New granular format: {day: boolean, evening: boolean, night: boolean}
        // Convert to old format: available if ANY shift is true
        const hasAnyShift = dayData.day === true || dayData.evening === true || dayData.night === true;
        convertedDayConstraints[day] = {
          available: hasAnyShift,
          strict: true // Granular constraints are treated as strict
        };
      } else {
        // Fallback to default
        convertedDayConstraints[day] = { available: true, strict: false };
      }
    }
    
    return {
      work_percentage: (() => {
        // Handle both new work_percentage and legacy max_shifts_per_week
        if (typeof jsonObj.work_percentage === 'number') {
          return Math.min(100, Math.max(0, Math.round(jsonObj.work_percentage / 5) * 5)); // Round to nearest 5%
        }
        if (typeof jsonObj.max_shifts_per_week === 'number') {
          // Convert old max_shifts_per_week to percentage (5 days = 100%)
          return Math.min(100, Math.max(0, Math.round((jsonObj.max_shifts_per_week / 5) * 100 / 5) * 5));
        }
        return defaultPreferences.work_percentage;
      })(),
      day_constraints: convertedDayConstraints as WorkPreferences['day_constraints'],
      shift_constraints: jsonObj.shift_constraints as WorkPreferences['shift_constraints'] || defaultPreferences.shift_constraints,
      hard_blocked_slots: Array.isArray(jsonObj.hard_blocked_slots) 
        ? (jsonObj.hard_blocked_slots as HardBlockedSlot[])
        : [],
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
    work_percentage: (() => {
      // Handle both new work_percentage and legacy max_shifts_per_week
      if (typeof jsonObj.work_percentage === 'number') {
        return Math.min(100, Math.max(0, Math.round(jsonObj.work_percentage / 5) * 5)); // Round to nearest 5%
      }
      if (typeof jsonObj.max_shifts_per_week === 'number') {
        // Convert old max_shifts_per_week to percentage (5 days = 100%)
        return Math.min(100, Math.max(0, Math.round((jsonObj.max_shifts_per_week / 5) * 100 / 5) * 5));
      }
      return defaultPreferences.work_percentage;
    })(),
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
    hard_blocked_slots: Array.isArray(jsonObj.hard_blocked_slots) 
      ? (jsonObj.hard_blocked_slots as HardBlockedSlot[])
      : [],
  };
  
  return converted;
}
