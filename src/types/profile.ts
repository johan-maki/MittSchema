
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

export interface WorkPreferences {
  preferred_shifts: ("day" | "evening" | "night")[];
  max_shifts_per_week: number;
  available_days: string[];
  // New fields for hard vs soft constraints
  available_days_strict?: boolean;  // If true, available_days becomes a hard constraint
  preferred_shifts_strict?: boolean; // If true, preferred_shifts becomes a hard constraint
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
    preferred_shifts: ["day"],
    max_shifts_per_week: 5,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  };

  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaultPreferences;
  }

  const jsonObj = json as Record<string, unknown>;
  
  const converted = {
    preferred_shifts: Array.isArray(jsonObj.preferred_shifts) 
      ? jsonObj.preferred_shifts.filter((shift): shift is "day" | "evening" | "night" => 
          ["day", "evening", "night"].includes(String(shift)))
      : defaultPreferences.preferred_shifts,
    max_shifts_per_week: typeof jsonObj.max_shifts_per_week === 'number' 
      ? jsonObj.max_shifts_per_week 
      : defaultPreferences.max_shifts_per_week,
    available_days: Array.isArray(jsonObj.available_days) 
      ? jsonObj.available_days.map(String)
      : defaultPreferences.available_days,
    // Add new strict fields with default false
    available_days_strict: typeof jsonObj.available_days_strict === 'boolean' 
      ? jsonObj.available_days_strict 
      : false,
    preferred_shifts_strict: typeof jsonObj.preferred_shifts_strict === 'boolean' 
      ? jsonObj.preferred_shifts_strict 
      : false,
  };
  
  return converted;
}
