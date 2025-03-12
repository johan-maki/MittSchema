
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

// Add a function to programmatically add our Hollywood celebrities
export const addHollywoodCelebrities = async (): Promise<void> => {
  try {
    const celebrities = [
      {
        first_name: 'Jennifer',
        last_name: 'Aniston',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        phone: '+46702345678',
        experience_level: 4
      },
      {
        first_name: 'Tom',
        last_name: 'Cruise',
        role: 'Läkare',
        department: 'Ortopedi',
        phone: '+46707654321',
        experience_level: 5
      },
      {
        first_name: 'Scarlett',
        last_name: 'Johansson',
        role: 'Undersköterska',
        department: 'Barnavdelning',
        phone: '+46706789012',
        experience_level: 3
      },
      {
        first_name: 'Robert',
        last_name: 'Downey',
        role: 'Sjuksköterska',
        department: 'Intensivvård',
        phone: '+46708765432',
        experience_level: 5
      },
      {
        first_name: 'Emma',
        last_name: 'Stone',
        role: 'Undersköterska',
        department: 'Psykiatri',
        phone: '+46709876543',
        experience_level: 2
      },
      {
        first_name: 'Dwayne',
        last_name: 'Johnson',
        role: 'Läkare',
        department: 'Akuten',
        phone: '+46701122334',
        experience_level: 4
      }
    ];
    
    console.log("Adding Hollywood celebrities...");
    
    // Add each celebrity sequentially
    for (const celebrity of celebrities) {
      await addProfile(celebrity);
      console.log(`Added ${celebrity.first_name} ${celebrity.last_name}`);
    }
    
    console.log("All celebrities added successfully!");
  } catch (error) {
    console.error("Error adding Hollywood celebrities:", error);
    throw error;
  }
};
