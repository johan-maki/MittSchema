// Production data seeder - adds sample employees for demo purposes
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

export const addSampleEmployeesForProduction = async () => {
  // Only run in production (not localhost)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (import.meta.env.DEV || isLocalhost) {
    console.log('🏠 Development/localhost mode: Skipping production employee creation');
    return;
  }

  console.log('🌐 Production mode: Checking for sample employees...');

  try {
    // Add a small delay to ensure Supabase is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if we already have employees
    const { data: existingEmployees, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .limit(1);

    if (checkError) {
      console.warn('Could not check existing employees, skipping:', checkError.message);
      return; // Fail gracefully
    }

    if (existingEmployees && existingEmployees.length > 0) {
      console.log('✅ Employees already exist in production');
      return;
    }

    const sampleEmployees = [
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
        first_name: 'Kung',
        last_name: 'Maxx',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: ''
      },
      {
        id: uuidv4(),
        first_name: 'Anna',
        last_name: 'Andersson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_level: 1,
        phone: '+46 70 123 4567'
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
