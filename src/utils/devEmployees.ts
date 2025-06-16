// Development utility to add test employees
import { supabase } from "@/integrations/supabase/client";

export const addTestEmployeesForDevelopment = async () => {
  // Only run in development mode (localhost)
  const isDevelopment = import.meta.env.DEV && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (!isDevelopment) {
    return;
  }

  console.log('🏥 Development mode: Adding test employees...');

  try {
    // Check if we already have employees
    const { data: existingEmployees, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing employees:', checkError);
      return;
    }

    if (existingEmployees && existingEmployees.length > 0) {
      console.log('✅ Employees already exist, skipping creation');
      return;
    }

    const testEmployees = [
      {
        first_name: 'Anna',
        last_name: 'Andersson',
        role: 'Läkare',
        department: 'General',
        experience_level: 4,
        phone: '070-123-4567'
      },
      {
        first_name: 'Bengt', 
        last_name: 'Bengtsson',
        role: 'Sjuksköterska',
        department: 'General',
        experience_level: 3,
        phone: '070-234-5678'
      },
      {
        first_name: 'Cecilia',
        last_name: 'Carlsson', 
        role: 'Undersköterska',
        department: 'General',
        experience_level: 2,
        phone: '070-345-6789'
      },
      {
        first_name: 'David',
        last_name: 'Davidsson',
        role: 'Läkare', 
        department: 'General',
        experience_level: 5,
        phone: '070-456-7890'
      },
      {
        first_name: 'Emma',
        last_name: 'Eriksson',
        role: 'Sjuksköterska',
        department: 'General', 
        experience_level: 4,
        phone: '070-567-8901'
      }
    ];

    const { data, error } = await supabase
      .from('employees')
      .insert(testEmployees)
      .select();

    if (error) {
      console.error('❌ Error adding test employees:', error);
      return;
    }

    console.log('✅ Added test employees for development:', data.length);
    data?.forEach(emp => console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role})`));

  } catch (error) {
    console.error('❌ Exception adding test employees:', error);
  }
};
