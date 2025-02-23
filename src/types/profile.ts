
import type { Json } from "@/integrations/supabase/types";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string | null;
  phone: string | null;
  experience_level: number;
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
};

export type InsertProfile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  experience_level?: number;
};

export interface WorkPreferences {
  preferred_shifts: ("day" | "evening" | "night")[];
  max_shifts_per_week: number;
  available_days: string[];
}

export type DatabaseProfile = Omit<Profile, 'work_preferences'> & {
  work_preferences: Json;
};

// Helper function to convert database profile to our internal Profile type
export function convertDatabaseProfile(dbProfile: DatabaseProfile): Profile {
  return {
    ...dbProfile,
    work_preferences: dbProfile.work_preferences as WorkPreferences,
  };
}
