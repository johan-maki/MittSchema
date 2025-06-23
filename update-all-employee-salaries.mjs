import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateAllEmployeeSalaries() {
  console.log('💰 Updating all employees to 1000 SEK hourly rate...');
  
  try {
    // First check current state
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hourly_rate');
    
    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      return;
    }
    
    console.log('📊 Current employee salaries:');
    employees?.forEach(emp => {
      console.log(`   ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate || 'NULL'} SEK/hour`);
    });
    
    // Update all employees to 1000 SEK
    const { data: updatedEmployees, error: updateError } = await supabase
      .from('employees')
      .update({ hourly_rate: 1000.00 })
      .select('id, first_name, last_name, hourly_rate');
    
    if (updateError) {
      console.error('❌ Error updating salaries:', updateError);
      return;
    }
    
    console.log('\n✅ Successfully updated all employees to 1000 SEK/hour!');
    console.log('📊 Updated employee salaries:');
    updatedEmployees?.forEach(emp => {
      console.log(`   ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate} SEK/hour`);
    });
    
    console.log(`\n🎉 Total employees updated: ${updatedEmployees?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Failed to update employee salaries:', error);
  }
}

updateAllEmployeeSalaries();
