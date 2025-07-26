// One-time migration to fix existing employees without work_preferences
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function fixExistingEmployees() {
  console.log('🔧 Fixing existing employees without work_preferences...');
  
  try {
    // Find employees with null or missing work_preferences
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, work_preferences')
      .or('work_preferences.is.null,work_preferences.eq.null');

    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      return;
    }

    console.log(`📊 Found ${employees.length} employees without work_preferences`);

    for (const employee of employees) {
      console.log(`🔄 Updating ${employee.first_name} ${employee.last_name}...`);
      
      const { error: updateError } = await supabase
        .from('employees')
        .update({ work_preferences: defaultWorkPreferences })
        .eq('id', employee.id);

      if (updateError) {
        console.error(`❌ Failed to update ${employee.first_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${employee.first_name} ${employee.last_name}`);
      }
    }

    console.log('🎉 Migration complete! All employees now have work_preferences');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
fixExistingEmployees();
