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

async function checkAugust1Shifts() {
  console.log('🔍 Checking shifts for August 1, 2025...\n');
  
  // Check all shifts on August 1st (including night shifts that start on Aug 1)
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      employee_id,
      start_time,
      end_time,
      shift_type,
      date,
      created_at,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .gte('start_time', '2025-08-01T00:00:00.000Z')
    .lt('start_time', '2025-08-02T00:00:00.000Z')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching shifts:', error);
    return;
  }

  console.log(`📊 Found ${shifts?.length || 0} shifts starting on August 1, 2025:`);
  console.log('');

  if (shifts && shifts.length > 0) {
    shifts.forEach((shift, index) => {
      const employeeName = shift.employees ? 
        `${shift.employees.first_name} ${shift.employees.last_name}` : 
        'Unknown Employee';
      
      console.log(`${index + 1}. ${shift.shift_type.toUpperCase()} SHIFT`);
      console.log(`   👤 Employee: ${employeeName}`);
      console.log(`   🕐 Start: ${shift.start_time}`);
      console.log(`   🕐 End: ${shift.end_time}`);
      console.log(`   📅 Date: ${shift.date || 'N/A'}`);
      console.log(`   🆔 ID: ${shift.id}`);
      console.log('');
    });

    // Group by shift type
    const byType = shifts.reduce((acc, shift) => {
      acc[shift.shift_type] = (acc[shift.shift_type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 SHIFT TYPE BREAKDOWN FOR AUGUST 1:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} shift(s)`);
    });
  } else {
    console.log('❌ No shifts found for August 1, 2025');
  }

  // Also check for night shifts that END on August 1 (started July 31)
  console.log('\n' + '='.repeat(50));
  console.log('🔍 Checking night shifts that END on August 1, 2025...\n');

  const { data: nightShifts, error: nightError } = await supabase
    .from('shifts')
    .select(`
      id,
      employee_id,
      start_time,
      end_time,
      shift_type,
      date,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .gte('end_time', '2025-08-01T00:00:00.000Z')
    .lt('end_time', '2025-08-02T00:00:00.000Z')
    .eq('shift_type', 'night')
    .order('start_time', { ascending: true });

  if (nightError) {
    console.error('❌ Error fetching night shifts:', nightError);
    return;
  }

  console.log(`📊 Found ${nightShifts?.length || 0} night shifts ending on August 1, 2025:`);
  console.log('');

  if (nightShifts && nightShifts.length > 0) {
    nightShifts.forEach((shift, index) => {
      const employeeName = shift.employees ? 
        `${shift.employees.first_name} ${shift.employees.last_name}` : 
        'Unknown Employee';
      
      console.log(`${index + 1}. NIGHT SHIFT (ending Aug 1)`);
      console.log(`   👤 Employee: ${employeeName}`);
      console.log(`   🕐 Start: ${shift.start_time}`);
      console.log(`   🕐 End: ${shift.end_time}`);
      console.log(`   📅 Date: ${shift.date || 'N/A'}`);
      console.log(`   🆔 ID: ${shift.id}`);
      console.log('');
    });
  } else {
    console.log('❌ No night shifts found ending on August 1, 2025');
  }

  // Summary
  const totalAug1Coverage = (shifts?.length || 0) + (nightShifts?.length || 0);
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TOTAL AUGUST 1 COVERAGE: ${totalAug1Coverage} shifts`);
  console.log(`   - Starting on Aug 1: ${shifts?.length || 0}`);
  console.log(`   - Ending on Aug 1: ${nightShifts?.length || 0}`);
}

checkAugust1Shifts().catch(console.error);
