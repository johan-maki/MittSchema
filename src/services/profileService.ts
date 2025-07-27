
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

/**
 * Clear all profiles from the database
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    console.log("Clearing all data from database...");
    
    // First, delete all shifts to avoid foreign key constraint violations
    console.log("Clearing shifts...");
    const { error: shiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition is always true, deleting all rows
    
    if (shiftsError) {
      console.error('Error clearing shifts:', shiftsError);
      throw shiftsError;
    }
    
    // Then, delete all employees
    console.log("Clearing employees...");
    const { error: employeesError } = await supabase
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This condition is always true, deleting all rows
    
    if (employeesError) {
      console.error('Error clearing employees:', employeesError);
      throw employeesError;
    }
    
    console.log("Database cleared successfully");
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Generate test data with specified number of employees
 */
export const generateTestData = async (count: number): Promise<Profile[]> => {
  try {
    console.log(`Generating ${count} test employees...`);
    
    const testNames = [
      { first: 'Maria', last: 'Johansson', role: 'Sjuksköterska' },
      { first: 'Lars', last: 'Andersson', role: 'Läkare' },
      { first: 'Anna', last: 'Nilsson', role: 'Undersköterska' },
      { first: 'Erik', last: 'Svensson', role: 'Sjuksköterska' },
      { first: 'Sara', last: 'Lindberg', role: 'Läkare' },
      { first: 'David', last: 'Karlsson', role: 'Undersköterska' },
      { first: 'Emma', last: 'Eriksson', role: 'Sjuksköterska' },
      { first: 'Johan', last: 'Gustafsson', role: 'Läkare' }
    ];
    
    const testEmployees = [];
    for (let i = 0; i < count; i++) {
      const nameData = testNames[i % testNames.length];
      
      // Default work preferences allowing all shifts and all days, max 5 days per week
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
      
      testEmployees.push({
        id: uuidv4(),
        first_name: nameData.first + (i >= testNames.length ? ` ${Math.floor(i/testNames.length) + 1}` : ''),
        last_name: nameData.last,
        role: nameData.role,
        department: 'Akutmottagning',
        phone: `+46 70 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
        experience_level: Math.floor(Math.random() * 3) + 1, // 1-3
        hourly_rate: 1000,
        is_manager: false,
        work_preferences: defaultWorkPreferences
      });
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(testEmployees)
      .select();
    
    if (error) {
      console.error('Error inserting test data:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from test data insertion');
    }
    
    // Convert the database response to our Profile type
    const profiles = data.map(convertDatabaseProfile);
    
    console.log(`Successfully generated ${profiles.length} test employees`);
    return profiles;
  } catch (error) {
    console.error('Error generating test data:', error);
    throw error;
  }
};
export const addHollywoodCelebrities = async (): Promise<void> => {
  // Function left intentionally empty
  console.log("Hollywood celebrities function disabled");
}
