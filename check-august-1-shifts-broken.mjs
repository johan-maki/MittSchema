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

async function debugFrontendFiltering() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DEBUGGING FRONTEND FILTERING FOR AUGUST 1ST...\n');
  
  // Simulate the exact frontend month view query
  const currentDate = new Date('2025-08-28T09:01:50.553Z'); // User's current view
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const startDateStr = startOfMonth.toISOString();
  const endDateStr = endOfMonth.toISOString();
  
  console.log('📅 FRONTEND QUERY PARAMETERS:');
  console.log('  Current Date:', currentDate.toISOString());
  console.log('  Start Range:', startDateStr);
  console.log('  End Range:', endDateStr);
  console.log('  Target Month:', currentDate.getMonth() + 1, '(August)');
  console.log('  Target Year:', currentDate.getFullYear());
  console.log('');
  
  // Query exactly like frontend does
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
    .gte('start_time', startDateStr)
    .lte('start_time', endDateStr)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error('❌ Error in frontend query:', error);
    return;
  }
  
  console.log(`📊 FRONTEND RETRIEVED: ${shifts?.length || 0} total shifts`);
  
  // Filter for August 1st
  const august1Raw = shifts?.filter(shift => {
    const shiftDate = shift.start_time ? shift.start_time.split('T')[0] : null;
    return shiftDate === '2025-08-01';
  }) || [];
  
  console.log(`\n🎯 AUGUST 1ST RAW FROM QUERY: ${august1Raw.length} shifts`);
  august1Raw.forEach((shift, i) => {
    console.log(`  ${i + 1}. ${shift.shift_type.toUpperCase()} - ${shift.employees?.first_name} ${shift.employees?.last_name}`);
    console.log(`     Start: ${shift.start_time}`);
    console.log(`     ID: ${shift.id}`);
  });
  
  // Apply frontend filtering logic
  console.log('\n🔧 APPLYING FRONTEND FILTERS...');
  
  const targetMonth = currentDate.getMonth() + 1; // August = 8
  const targetYear = currentDate.getFullYear(); // 2025
  
  const validShifts = shifts?.filter(shift => {
    // Month boundary filter from useShiftData.ts
    const shiftStartTime = shift.start_time;
    
    if (shiftStartTime) {
      const [shiftYear, shiftMonth] = shiftStartTime.split('-').map(Number);
      
      if (shiftMonth !== targetMonth || shiftYear !== targetYear) {
        console.warn(`🚨 FRONTEND FILTERING OUT:`, {
          id: shift.id,
          start_time: shiftStartTime,
          shift_month: shiftMonth,
          target_month: targetMonth,
          employee: shift.employees?.first_name,
          shift_type: shift.shift_type,
          reason: 'Month/Year mismatch'
        });
        return false;
      }
    }
    
    // Profile validation (using employees instead of profiles)
    if (!shift.employees || typeof shift.employees !== 'object') {
      console.warn(`🚨 FRONTEND FILTERING OUT - Invalid employee data:`, {
        id: shift.id,
        shift_type: shift.shift_type,
        employee_data: shift.employees
      });
      return false;
    }
    
    if (!shift.employees.first_name || !shift.employees.last_name) {
      console.warn(`🚨 FRONTEND FILTERING OUT - Missing employee name:`, {
        id: shift.id,
        shift_type: shift.shift_type,
        first_name: shift.employees.first_name,
        last_name: shift.employees.last_name
      });
      return false;
    }
    
    return true;
  }) || [];
  
  console.log(`\n✅ VALID SHIFTS AFTER FILTERING: ${validShifts.length}`);
  
  // Check August 1st after filtering
  const august1Valid = validShifts.filter(shift => {
    const shiftDate = shift.start_time ? shift.start_time.split('T')[0] : null;
    return shiftDate === '2025-08-01';
  });
  
  console.log(`\n🎯 AUGUST 1ST AFTER FRONTEND FILTERING: ${august1Valid.length} shifts`);
  august1Valid.forEach((shift, i) => {
    console.log(`  ${i + 1}. ${shift.shift_type.toUpperCase()} - ${shift.employees?.first_name} ${shift.employees?.last_name}`);
    console.log(`     Start: ${shift.start_time}`);
    console.log(`     ID: ${shift.id}`);
  });
  
  if (august1Valid.length < 3) {
    console.log('\n🚨 PROBLEM IDENTIFIED!');
    console.log('Expected 3 shifts (day, evening, night), got:', august1Valid.length);
    
    const originalTypes = august1Raw.map(s => s.shift_type);
    const filteredTypes = august1Valid.map(s => s.shift_type);
    const missingTypes = ['day', 'evening', 'night'].filter(type => !filteredTypes.includes(type));
    
    console.log('Originally retrieved:', originalTypes);
    console.log('After filtering:', filteredTypes);
    console.log('Missing types:', missingTypes);
    
    // Check which specific shifts were filtered out
    const filteredOutShifts = august1Raw.filter(raw => 
      !august1Valid.some(valid => valid.id === raw.id)
    );
    
    if (filteredOutShifts.length > 0) {
      console.log('\n🚨 SHIFTS THAT WERE FILTERED OUT:');
      filteredOutShifts.forEach(shift => {
        console.log(`  - ${shift.shift_type.toUpperCase()} (${shift.employees?.first_name} ${shift.employees?.last_name})`);
        console.log(`    Reason: Check filtering logic above`);
      });
    }
  } else {
    console.log('\n✅ All August 1st shifts passed frontend filtering!');
  }

  // NEW: Debug UI Rendering Logic
  console.log('\n🎨 UI RENDERING SIMULATION:');
  console.log('==========================================');
  
  // Simulate the exact getShiftsByType logic from ModernMonthlySchedule.tsx
  const shiftsByType = {
    day: shifts.filter(s => s.shift_type === 'day'),
    evening: shifts.filter(s => s.shift_type === 'evening'),
    night: shifts.filter(s => s.shift_type === 'night')
  };

  console.log(`📊 Shifts by type:`);
  console.log(`   Day: ${shiftsByType.day.length} shifts`);
  console.log(`   Evening: ${shiftsByType.evening.length} shifts`);
  console.log(`   Night: ${shiftsByType.night.length} shifts`);

  // CRITICAL: Test the slice(0, 2) rendering logic
  console.log('\n🔍 UI RENDERING TEST (slice(0, 2) per type):');
  
  Object.entries(shiftsByType).forEach(([shiftType, shiftsOfType]) => {
    if (shiftsOfType.length === 0) {
      console.log(`   ${shiftType.toUpperCase()}: No shifts to render`);
      return;
    }
    
    const visibleShifts = shiftsOfType.slice(0, 2);
    console.log(`
   ${shiftType.toUpperCase()} SHIFTS:`);
    console.log(`   - Total: ${shiftsOfType.length}`);
    console.log(`   - Visible (after slice): ${visibleShifts.length}`);
    
    shiftsOfType.forEach((shift, index) => {
      const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
      const status = index < 2 ? '✅ VISIBLE' : '❌ HIDDEN by slice(0,2)';
      console.log(`     ${index + 1}. ${employee} - ${status}`);
    });
  });

  // Summary
  const totalShifts = shifts.length;
  const totalVisible = Math.min(2, shiftsByType.day.length) + 
                      Math.min(2, shiftsByType.evening.length) + 
                      Math.min(2, shiftsByType.night.length);
  
  console.log('\n🏁 RENDERING SUMMARY:');
  console.log(`   📊 Total shifts: ${totalShifts}`);
  console.log(`   👁️  Visible in UI: ${totalVisible}`);
  console.log(`   🚫 Hidden by UI: ${totalShifts - totalVisible}`);
  
  if (totalShifts !== totalVisible) {
    console.log('\n🚨 UI RENDERING BUG FOUND!');
    console.log('   The slice(0, 2) logic in ModernMonthlySchedule.tsx');
    console.log('   is limiting display to 2 shifts per type.');
    console.log('   This explains why some shifts do not appear in the UI!');
  } else {
    console.log('\n✨ No UI rendering issues detected');
  }
}

checkAugust1Shifts()
  .then(() => debugFrontendFiltering())
  .catch(console.error);
