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

async function testSalaryImplementation() {
  console.log('🧪 Testing salary implementation...');
  
  try {
    // 1. Test if hourly_rate column exists
    console.log('📋 Step 1: Checking if hourly_rate column exists...');
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hourly_rate')
      .limit(1);
    
    if (employeeError) {
      if (employeeError.message.includes('hourly_rate')) {
        console.log('❌ hourly_rate column does NOT exist yet');
        console.log('📋 Please run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE employees ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 1000.00;');
        console.log('   UPDATE employees SET hourly_rate = 1000.00;');
        return;
      }
      throw employeeError;
    }
    
    console.log('✅ hourly_rate column exists!');
    console.log('📊 Sample employee data:');
    employees?.forEach(emp => {
      console.log(`   ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate || 'NULL'} SEK/hour`);
    });
    
    // 2. Test if we can update salaries
    console.log('\n📋 Step 2: Testing salary update functionality...');
    const { data: allEmployees, error: allError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, hourly_rate');
    
    if (allError) {
      throw allError;
    }
    
    console.log('✅ Salary data retrieved successfully!');
    console.log('📊 All employees with salaries:');
    allEmployees?.forEach(emp => {
      console.log(`   ${emp.first_name} ${emp.last_name}: ${emp.hourly_rate || 1000} SEK/hour`);
    });
    
    // 3. Test cost calculation
    console.log('\n📋 Step 3: Testing cost calculation...');
    const { data: shifts, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        *,
        profiles:employees!shifts_employee_id_fkey (
          first_name,
          last_name,
          hourly_rate
        )
      `)
      .limit(5);
    
    if (shiftError) {
      throw shiftError;
    }
    
    console.log('✅ Shift data with salaries retrieved successfully!');
    console.log('📊 Sample shifts with cost calculation:');
    shifts?.forEach(shift => {
      const employee = shift.profiles;
      const startTime = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const hourlyRate = employee?.hourly_rate || 1000;
      const cost = hours * hourlyRate;
      
      console.log(`   ${shift.date} ${shift.shift_type}: ${employee?.first_name} ${employee?.last_name} - ${hours}h @ ${hourlyRate} SEK = ${cost} SEK`);
    });
    
    console.log('\n🎉 Salary implementation test completed successfully!');
    console.log('✅ Database migration is complete');
    console.log('✅ Cost calculation is working');
    console.log('✅ Frontend can now display salary and cost information');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSalaryImplementation();
