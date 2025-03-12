
import { supabase } from "@/integrations/supabase/client";
import { convertDatabaseProfile, InsertProfile, Profile } from "@/types/profile";
import { v4 as uuidv4 } from "uuid";

/**
 * Add a new profile in development mode, bypassing auth user creation
 */
export const addProfile = async (profileData: Omit<InsertProfile, 'id'>): Promise<Profile> => {
  try {
    // Generate a random UUID for the new profile
    const newId = uuidv4();
    
    console.log("Adding new profile with ID:", newId);
    
    // Insert directly into the employees table instead of using RPC
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        id: newId,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        department: profileData.department || null,
        phone: profileData.phone || null,
        experience_level: profileData.experience_level || 1
      }])
      .select();
    
    if (error) {
      console.error('Error inserting profile:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('No profile data returned from database');
    }
    
    // Convert the database response to our Profile type
    const profile = convertDatabaseProfile(data[0]);
    
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
