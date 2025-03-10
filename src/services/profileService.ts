
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
    
    // Call the dev_add_profile RPC function to bypass foreign key constraints
    const { data, error } = await supabase.rpc('dev_add_profile', {
      profile_id: newId,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role_val: profileData.role,
      department_val: profileData.department || null,
      phone_val: profileData.phone || null,
      experience_level_val: profileData.experience_level || 1
    });
    
    if (error) {
      console.error('Error from RPC function:', error);
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
      .select('*');
    
    if (error) throw error;
    
    // Convert database profiles to our Profile type
    const profiles = data.map(convertDatabaseProfile);
    
    console.log("Profiles fetched:", profiles);
    return profiles;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
};
