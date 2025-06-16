// Create test employees directly via SQL
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pzqwkdqbgqgpfcklhlhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXdrZHFiZ3FncGZja2xobGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzM1NjQsImV4cCI6MjA0NjY0OTU2NH0.GFQN3sI2wFY7N5A02HDUUE3aQT9oEaRIoSBECdE0wpI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmployees() {
  console.log('🏥 Creating test employees...');
  
  const employees = [
    { first_name: 'Anna', last_name: 'Andersson', role: 'Läkare', department: 'General', experience_level: 4 },
    { first_name: 'Bengt', last_name: 'Bengtsson', role: 'Sjuksköterska', department: 'General', experience_level: 3 },
    { first_name: 'Cecilia', last_name: 'Carlsson', role: 'Undersköterska', department: 'General', experience_level: 2 },
    { first_name: 'David', last_name: 'Davidsson', role: 'Läkare', department: 'General', experience_level: 5 },
    { first_name: 'Emma', last_name: 'Eriksson', role: 'Sjuksköterska', department: 'General', experience_level: 4 }
  ];

  try {
    const { data, error } = await supabase
      .from('employees')
      .insert(employees)
      .select();

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success! Added employees:', data.length);
      data.forEach(emp => console.log(`  - ${emp.first_name} ${emp.last_name} (${emp.role})`));
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

createEmployees();
