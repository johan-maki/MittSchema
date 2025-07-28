import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 DEBUGGING ERIK\'S MISSING NIGHT SHIFT');
console.log('=' .repeat(50));

async function debugErikShift() {
  // Get August 1st shifts exactly like the frontend does
  console.log('📅 Fetching August 1st shifts with frontend query...');
  
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      date,
      start_time,
      end_time,
      shift_type,
      employee_id,
      department,
      notes,
      created_at,
      updated_at,
      is_published,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name,
        experience_level
      )
    `)
    .gte('start_time', '2025-08-01T00:00:00.000Z')
    .lt('start_time', '2025-08-02T00:00:00.000Z')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${shifts?.length || 0} shifts for August 1st`);
  
  if (!shifts || shifts.length === 0) {
    console.log('❌ No shifts found!');
    return;
  }

  // Show all shifts
  console.log('\n🔍 ALL AUGUST 1ST SHIFTS:');
  shifts.forEach((shift, i) => {
    const employee = shift.employees;
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
    
    console.log(`${i + 1}. ${shift.shift_type.toUpperCase()} - ${employeeName}`);
    console.log(`   Start: ${shift.start_time}`);
    console.log(`   End: ${shift.end_time}`);
    console.log(`   Employee ID: ${shift.employee_id}`);
    console.log(`   Employee data: ${JSON.stringify(employee)}`);
    console.log('');
  });

  // Check specifically for Erik
  const erikShifts = shifts.filter(shift => 
    shift.employees?.first_name?.toLowerCase().includes('erik')
  );

  console.log(`🎯 ERIK SHIFTS FOUND: ${erikShifts.length}`);
  
  if (erikShifts.length > 0) {
    erikShifts.forEach((shift, i) => {
      console.log(`Erik shift ${i + 1}:`);
      console.log(`  Type: ${shift.shift_type}`);
      console.log(`  Start: ${shift.start_time}`);
      console.log(`  Employee data valid: ${shift.employees ? 'YES' : 'NO'}`);
      console.log(`  Has first_name: ${'first_name' in (shift.employees || {})}`);
      console.log(`  Has last_name: ${'last_name' in (shift.employees || {})}`);
    });
  } else {
    console.log('❌ NO ERIK SHIFTS FOUND!');
    
    // Check if there are shifts without proper employee data
    const shiftsWithoutEmployee = shifts.filter(shift => !shift.employees);
    console.log(`🚨 Shifts without employee data: ${shiftsWithoutEmployee.length}`);
    
    shiftsWithoutEmployee.forEach(shift => {
      console.log(`  Shift ${shift.id}: ${shift.shift_type}, employee_id: ${shift.employee_id}`);
    });
  }

  // Test the exact frontend filtering logic
  console.log('\n🔧 TESTING FRONTEND FILTERING LOGIC:');
  
  const validShifts = shifts.filter(shift => {
    // Month boundary check
    const shiftStartTime = shift.start_time;
    if (shiftStartTime) {
      const [shiftYear, shiftMonth] = shiftStartTime.split('-').map(Number);
      if (shiftMonth !== 8 || shiftYear !== 2025) {
        console.log(`❌ FILTERED OUT - Wrong month/year: ${shift.shift_type} (${shiftMonth}/${shiftYear})`);
        return false;
      }
    }

    // Profile validation  
    if (!shift.employees || typeof shift.employees !== 'object') {
      console.log(`❌ FILTERED OUT - Invalid employee data: ${shift.shift_type}`);
      return false;
    }

    if (!shift.employees.first_name || !shift.employees.last_name) {
      console.log(`❌ FILTERED OUT - Missing name: ${shift.shift_type} (${shift.employees.first_name}, ${shift.employees.last_name})`);
      return false;
    }

    console.log(`✅ PASSED FILTERING: ${shift.shift_type} - ${shift.employees.first_name} ${shift.employees.last_name}`);
    return true;
  });

  console.log(`\n📊 FILTERING RESULTS:`);
  console.log(`  Original shifts: ${shifts.length}`);
  console.log(`  After filtering: ${validShifts.length}`);
  console.log(`  Filtered out: ${shifts.length - validShifts.length}`);

  if (validShifts.length < 3) {
    console.log('\n🚨 PROBLEM CONFIRMED: Erik\'s shift is being filtered out!');
  } else {
    console.log('\n✅ All shifts passed filtering - issue must be elsewhere');
  }
}

debugErikShift().then(() => {
  console.log('\n✅ Debug complete');
}).catch(console.error);
