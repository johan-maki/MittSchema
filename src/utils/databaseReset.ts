// Database reset utility - cleans and reseeds with simplified data
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const resetDatabaseWithSimplifiedData = async () => {
  console.log('🗑️ Starting database reset...');
  
  try {
    // First, clear existing data - DELETE SHIFTS FIRST due to foreign key constraints
    console.log('🧹 Clearing existing shifts...');
    const { error: deleteShiftsError } = await supabase
      .from('shifts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except non-existent dummy

    if (deleteShiftsError) {
      console.error('Error deleting shifts:', deleteShiftsError);
      throw deleteShiftsError;
    }

    console.log('🧹 Clearing existing employees...');
    const { error: deleteEmployeesError } = await supabase
      .from('employees')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except non-existent dummy

    if (deleteEmployeesError) {
      console.error('Error deleting employees:', deleteEmployeesError);
      throw deleteEmployeesError;
    }

    // Insert simplified employee data
    console.log('👥 Inserting simplified employees...');
    const simplifiedEmployees = [
      {
        id: uuidv4(),
        first_name: 'Erik',
        last_name: 'Eriksson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 234 5678'
      },
      {
        id: uuidv4(),
        first_name: 'Maria',
        last_name: 'Johansson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 345 6789'
      },
      {
        id: uuidv4(),
        first_name: 'Lars', 
        last_name: 'Larsson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 456 7890'
      },
      {
        id: uuidv4(),
        first_name: 'Karin',
        last_name: 'Karlsson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 567 8901'
      },
      {
        id: uuidv4(),
        first_name: 'Anna',
        last_name: 'Andersson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 123 4567'
      },
      {
        id: uuidv4(),
        first_name: 'David',
        last_name: 'Davidsson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 678 9012'
      }
    ];

    const { data: insertedEmployees, error: insertError } = await supabase
      .from('employees')
      .insert(simplifiedEmployees)
      .select();

    if (insertError) {
      console.error('Error inserting employees:', insertError);
      throw insertError;
    }

    console.log('✅ Database reset complete!');
    console.log(`📊 Inserted ${insertedEmployees?.length || 0} simplified employees:`);
    insertedEmployees?.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role}, ${emp.department}, ${emp.experience_level} år)`);
    });

    return {
      success: true,
      employees: insertedEmployees,
      message: `Successfully reset database with ${insertedEmployees?.length || 0} simplified employees`
    };

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return {
      success: false,
      error: error,
      message: 'Failed to reset database'
    };
  }
};

// Function to call from console
export const triggerDatabaseReset = () => {
  console.log('🚀 Manual database reset triggered...');
  return resetDatabaseWithSimplifiedData();
};
