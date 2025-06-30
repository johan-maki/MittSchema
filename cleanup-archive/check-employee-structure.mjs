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

async function checkEmployeeStructure() {
  console.log('🔍 Checking current employee structure...');
  
  // First, try to fetch employees to see what columns exist
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error fetching employees:', error);
    return;
  }
  
  if (employees && employees.length > 0) {
    console.log('📊 Employee structure (sample record):');
    console.log(JSON.stringify(employees[0], null, 2));
    
    // Check if hourly_rate column exists
    if ('hourly_rate' in employees[0]) {
      console.log('✅ hourly_rate column exists');
    } else {
      console.log('❌ hourly_rate column does NOT exist');
    }
  } else {
    console.log('⚠️ No employees found');
  }
  
  // Also get count of all employees
  const { data: countData, error: countError } = await supabase
    .from('employees')
    .select('id')
    .limit(1000);
  
  if (!countError && countData) {
    console.log(`📈 Total employees: ${countData.length}`);
  }
}

checkEmployeeStructure();
