// Production data seeder - adds sample employees for demo purposes
import { supabase } from "@/integrations/supabase/client";

export const addSampleEmployeesForProduction = async () => {
  // Only run in production (not localhost)
  const isProduction = !import.meta.env.DEV || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
  
  if (!isProduction) {
    console.log('🏠 Development mode: Skipping production employee creation');
    return;
  }

  console.log('🌐 Production mode: Checking for sample employees...');

  try {
    // Add a small delay to ensure Supabase is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if we already have employees
    const { data: existingEmployees, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing employees:', checkError);
      // Continue with creation anyway
    }

    if (existingEmployees && existingEmployees.length > 0) {
      console.log('✅ Employees already exist in production');
      return;
    }

    const sampleEmployees = [
      {
        first_name: 'Maria',
        last_name: 'Andersson',
        role: 'Läkare',
        department: 'General',
        experience_level: 5,
        phone: '070-111-1111'
      },
      {
        first_name: 'Erik', 
        last_name: 'Johansson',
        role: 'Sjuksköterska',
        department: 'General',
        experience_level: 4,
        phone: '070-222-2222'
      },
      {
        first_name: 'Sara',
        last_name: 'Petersson', 
        role: 'Undersköterska',
        department: 'General',
        experience_level: 3,
        phone: '070-333-3333'
      },
      {
        first_name: 'Johan',
        last_name: 'Lindberg',
        role: 'Läkare', 
        department: 'General',
        experience_level: 6,
        phone: '070-444-4444'
      },
      {
        first_name: 'Anna',
        last_name: 'Karlsson',
        role: 'Sjuksköterska',
        department: 'General', 
        experience_level: 3,
        phone: '070-555-5555'
      },
      {
        first_name: 'Peter',
        last_name: 'Svensson',
        role: 'Undersköterska',
        department: 'General', 
        experience_level: 2,
        phone: '070-666-6666'
      }
    ];

    const { data, error } = await supabase
      .from('employees')
      .insert(sampleEmployees)
      .select();

    if (error) {
      console.error('❌ Error adding sample employees:', error);
      return;
    }

    console.log('✅ Added sample employees for production demo:', data.length);
    data?.forEach(emp => console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role})`));

  } catch (error) {
    console.error('❌ Exception adding sample employees:', error);
  }
};
