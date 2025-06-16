// Add test employees to the database
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pzqwkdqbgqgpfcklhlhq.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXdrZHFiZ3FncGZja2xobGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzM1NjQsImV4cCI6MjA0NjY0OTU2NH0.GFQN3sI2wFY7N5A02HDUUE3aQT9oEaRIoSBECdE0wpI'
);

async function addTestEmployees() {
  console.log('🏥 Adding test employees to enable schedule generation...');
  
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

  for (const employee of testEmployees) {
    try {
      const { data, error } = await supabase.rpc('insert_employee', employee);
      
      if (error) {
        console.error(`❌ Error adding ${employee.first_name} ${employee.last_name}:`, error);
      } else {
        console.log(`✅ Added ${employee.first_name} ${employee.last_name} (${employee.role})`);
      }
    } catch (err) {
      console.error(`❌ Exception adding ${employee.first_name} ${employee.last_name}:`, err);
    }
  }
  
  // Check final count
  const { data: allEmployees, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error('❌ Error checking employees:', error);
  } else {
    console.log(`📊 Total employees in database: ${allEmployees?.length || 0}`);
  }
}

addTestEmployees();
