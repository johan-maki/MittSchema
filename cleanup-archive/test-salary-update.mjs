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

async function testSalaryUpdate() {
  console.log('🧪 Testing if we can update salary (hourly_rate)...');
  
  try {
    // Try to update one employee's hourly_rate to see if column exists
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching employees:', fetchError);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.log('⚠️ No employees found');
      return;
    }
    
    const testEmployee = employees[0];
    console.log(`🎯 Testing with employee: ${testEmployee.first_name} ${testEmployee.last_name}`);
    
    // Try to update hourly_rate
    const { error: updateError } = await supabase
      .from('employees')
      .update({ hourly_rate: 1000.00 })
      .eq('id', testEmployee.id);
    
    if (updateError) {
      console.error('❌ Error updating hourly_rate:', updateError);
      console.log('🔧 The hourly_rate column likely does not exist yet.');
      console.log('📋 Please run this SQL in Supabase SQL Editor:');
      console.log('   ALTER TABLE employees ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;');
      console.log('   UPDATE employees SET hourly_rate = 1000.00;');
      return;
    }
    
    console.log('✅ Successfully updated hourly_rate! Column exists.');
    
    // Verify the update
    const { data: updatedEmployee, error: verifyError } = await supabase
      .from('employees')
      .select('first_name, last_name, hourly_rate')
      .eq('id', testEmployee.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }
    
    console.log(`✅ Verified: ${updatedEmployee.first_name} ${updatedEmployee.last_name} has hourly_rate: ${updatedEmployee.hourly_rate} SEK`);
    
    // Now update all employees
    console.log('🔄 Updating all employees to 1000 SEK/hour...');
    const { error: updateAllError } = await supabase
      .from('employees')
      .update({ hourly_rate: 1000.00 })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all (using impossible ID for neq)
    
    if (updateAllError) {
      console.error('❌ Error updating all employees:', updateAllError);
      return;
    }
    
    console.log('✅ All employees updated successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSalaryUpdate();
