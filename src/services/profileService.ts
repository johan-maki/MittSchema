
import { supabase } from "@/integrations/supabase/client";
import { convertDatabaseProfile, InsertProfile, Profile } from "@/types/profile";
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a new profile by inserting directly into the employees table
 */
export const addProfile = async (profileData: Omit<InsertProfile, 'id'>): Promise<Profile> => {
  try {
    console.log("Adding new profile with data:", profileData);
    
    // Ensure experience_level is within the valid range (0-10)
    // Based on database constraint found in error messages
    const experience = Math.min(Math.max(profileData.experience_level || 1, 0), 10);
    
    // Default work preferences for all new employees
    const defaultWorkPreferences = {
      max_shifts_per_week: 5,
      day_constraints: {
        monday: { available: true, strict: false },
        tuesday: { available: true, strict: false },
        wednesday: { available: true, strict: false },
        thursday: { available: true, strict: false },
        friday: { available: true, strict: false },
        saturday: { available: true, strict: false },
        sunday: { available: true, strict: false }
      },
      shift_constraints: {
        day: { preferred: true, strict: false },
        evening: { preferred: true, strict: false },
        night: { preferred: true, strict: false }
      }
    };
    
    const insertData = {
      id: uuidv4(),
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role: profileData.role,
      department: profileData.department || null,
      phone: profileData.phone || null,
      experience_level: experience,
      hourly_rate: profileData.hourly_rate || 1000,
      is_manager: false,
      work_preferences: defaultWorkPreferences
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting profile:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No profile data returned from database');
    }
    
    // Convert the database response to our Profile type
    const profile = convertDatabaseProfile(data);
    
    console.log("Profile successfully added:", profile);
    return profile;
  } catch (error) {
    console.error('Error adding profile:', error);
    throw error;
  }
};

/**
 * Fetch all profiles from the database
 */
export const fetchProfiles = async (): Promise<Profile[]> => {
  try {
    console.log("Fetching profiles from database...");
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true });
    
    if (error) throw error;
    
    // Convert database profiles to our Profile type
    const profiles = data.map(convertDatabaseProfile);
    
    console.log("Profiles fetched:", profiles.length);
    return profiles;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
};

// Remove the Hollywood celebrities function as it was causing issues
// by trying to call the function on page load
export const addHollywoodCelebrities = async (): Promise<void> => {
  // Function left intentionally empty
  console.log("Hollywood celebrities function disabled");
}
