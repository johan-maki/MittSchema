
import { supabase } from "@/integrations/supabase/client";
import { convertDatabaseProfile, InsertProfile, Profile } from "@/types/profile";
import { v4 as uuidv4 } from 'uuid';

/**
 * Add a new profile by inserting directly into the employees table
 */
export const addProfile = async (profileData: Omit<InsertProfile, 'id'>): Promise<Profile> => {
  try {
    console.log("Adding new profile with data:", profileData);
    
    // Ensure experience_level is within the valid range (1-5)
    // Based on new experience points system
    const experience = Math.min(Math.max(profileData.experience_level || 1, 1), 5);
    
    // Default work preferences for all new employees
    const defaultWorkPreferences = {
      work_percentage: profileData.work_percentage || 100, // Use form value or default to 100%
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
    
    // Swedish nurse names (first names)
    const firstNames = [
      'Maria', 'Anna', 'Emma', 'Sara', 'Eva', 'Karin', 'Linda', 'Lena', 
      'Katarina', 'Susanne', 'Malin', 'Jenny', 'Johanna', 'Lisa', 'Annika',
      'Sofia', 'Helena', 'Petra', 'Ingrid', 'Birgitta', 'Elin', 'Ida',
      'Camilla', 'Charlotte', 'Louise', 'Jessica', 'Therese', 'Caroline',
      'Kristina', 'Cecilia', 'Ulrika', 'Hanna', 'Åsa', 'Erika', 'Monica',
      'Carina', 'Marianne', 'Elisabeth', 'Marie', 'Anette', 'Anneli',
      'Frida', 'Jennie', 'Viktoria', 'Gabriella', 'Magdalena', 'Rebecka',
      'Martina', 'Amanda', 'Tina', 'Nina', 'Alexandra', 'Veronica'
    ];
    
    // Swedish last names
    const lastNames = [
      'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson',
      'Olsson', 'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson',
      'Jansson', 'Hansson', 'Bengtsson', 'Jönsson', 'Lindberg', 'Jakobsson',
      'Magnusson', 'Olofsson', 'Lindström', 'Lindqvist', 'Lindgren', 'Axelsson',
      'Berg', 'Bergström', 'Lundberg', 'Lind', 'Lundgren', 'Lundqvist',
      'Mattsson', 'Berglund', 'Fredriksson', 'Sandberg', 'Henriksson', 'Forsberg',
      'Sjöberg', 'Wallin', 'Engström', 'Eklund', 'Danielsson', 'Håkansson',
      'Lundin', 'Björk', 'Bergman', 'Holmberg', 'Samuelsson', 'Fransson',
      'Wikström', 'Isaksson', 'Holm', 'Söderberg', 'Nyström', 'Arvidsson'
    ];
    
    const testEmployees = [];
    
    for (let i = 0; i < count; i++) {
      // Randomize work percentage: 70% full-time (100%), 20% part-time (75%), 10% part-time (50%)
      const rand = Math.random();
      let workPercentage: number;
      if (rand < 0.7) {
        workPercentage = 100; // 70% full-time
      } else if (rand < 0.9) {
        workPercentage = 75; // 20% at 75%
      } else {
        workPercentage = 50; // 10% at 50%
      }
      
      // Randomize shift constraints: 70% all shifts, 20% no nights, 10% day only
      const shiftRand = Math.random();
      let shiftConstraints;
      if (shiftRand < 0.7) {
        // 70% can work all shifts
        shiftConstraints = {
          day: { preferred: true, strict: false },
          evening: { preferred: true, strict: false },
          night: { preferred: true, strict: false }
        };
      } else if (shiftRand < 0.9) {
        // 20% cannot work nights
        shiftConstraints = {
          day: { preferred: true, strict: false },
          evening: { preferred: true, strict: false },
          night: { preferred: false, strict: true }
        };
      } else {
        // 10% day shift only
        shiftConstraints = {
          day: { preferred: true, strict: true },
          evening: { preferred: false, strict: true },
          night: { preferred: false, strict: true }
        };
      }
      
      const workPreferences = {
        work_percentage: workPercentage,
        day_constraints: {
          monday: { available: true, strict: false },
          tuesday: { available: true, strict: false },
          wednesday: { available: true, strict: false },
          thursday: { available: true, strict: false },
          friday: { available: true, strict: false },
          saturday: { available: true, strict: false },
          sunday: { available: true, strict: false }
        },
        shift_constraints: shiftConstraints
      };
      
      // Random unique name combination
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      testEmployees.push({
        id: uuidv4(),
        first_name: firstName,
        last_name: lastName,
        role: 'Sjuksköterska', // All test data are nurses
        department: 'Akutmottagning', // Same department
        phone: `+46 70 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
        experience_level: Math.floor(Math.random() * 5) + 1, // Random 1-5 experience
        hourly_rate: 1000,
        is_manager: false,
        work_preferences: workPreferences
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
    
    console.log(`Successfully generated ${profiles.length} test employees (Sjuksköterskor)`);
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
