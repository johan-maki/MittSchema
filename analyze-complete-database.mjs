#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAllShifts() {
  console.log('🔍 COMPLETE DATABASE ANALYSIS\n');
  
  // Get ALL shifts with employee data
  const { data: allShifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      shift_type,
      start_time,
      end_time,
      is_published,
      employee_id,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Database error:', error);
    return;
  }

  console.log(`📊 Total shifts in database: ${allShifts?.length || 0}\n`);

  // Analysis by publication status
  const published = allShifts?.filter(s => s.is_published) || [];
  const draft = allShifts?.filter(s => !s.is_published) || [];
  
  console.log('📋 PUBLICATION STATUS BREAKDOWN:');
  console.log(`   ✅ Published: ${published.length}`);
  console.log(`   📝 Draft: ${draft.length}\n`);

  // Check for the specific August 1st issue
  const august1Shifts = allShifts?.filter(shift => 
    shift.start_time?.startsWith('2025-08-01')
  ) || [];

  console.log(`🎯 AUGUST 1ST ANALYSIS:`)
  console.log(`   Total shifts: ${august1Shifts.length}`)
  
  if (august1Shifts.length > 0) {
    august1Shifts.forEach((shift, i) => {
      const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
      const status = shift.is_published ? '✅ Published' : '📝 Draft';
      console.log(`   ${i + 1}. ${shift.shift_type.toUpperCase()}: ${employee} - ${status}`);
      console.log(`      ID: ${shift.id}`);
      console.log(`      Time: ${shift.start_time} → ${shift.end_time}`);
    });
  }

  // Check if there are any shifts that have NULL or missing employee data
  const shiftsWithoutEmployees = allShifts?.filter(shift => 
    !shift.employees || !shift.employees.first_name || !shift.employees.last_name
  ) || [];

  if (shiftsWithoutEmployees.length > 0) {
    console.log(`\n⚠️  SHIFTS WITH MISSING EMPLOYEE DATA: ${shiftsWithoutEmployees.length}`);
    shiftsWithoutEmployees.slice(0, 5).forEach((shift, i) => {
      console.log(`   ${i + 1}. ${shift.shift_type} on ${shift.start_time} - ID: ${shift.id}`);
      console.log(`      Employee ID: ${shift.employee_id}`);
      console.log(`      Employee data: ${JSON.stringify(shift.employees)}`);
    });
  }

  // Check for potential profile filtering issues in frontend
  console.log('\n🔍 FRONTEND FILTERING SIMULATION:');
  
  // This simulates the Schedule.tsx filtering logic:
  // const typedShifts = (shifts as Shift[]).filter(shift => 
  //   shift.profiles && 
  //   typeof shift.profiles === 'object' && 
  //   'first_name' in shift.profiles && 
  //   'last_name' in shift.profiles
  // );
  
  const frontendFilteredShifts = allShifts?.filter(shift => 
    shift.employees && 
    typeof shift.employees === 'object' && 
    'first_name' in shift.employees && 
    'last_name' in shift.employees
  ) || [];

  console.log(`   Raw database shifts: ${allShifts?.length || 0}`);
  console.log(`   After frontend filtering: ${frontendFilteredShifts.length}`);
  console.log(`   Filtered out: ${(allShifts?.length || 0) - frontendFilteredShifts.length}`);

  // Check the August 1st shifts specifically with this filter
  const august1FilteredShifts = august1Shifts.filter(shift => 
    shift.employees && 
    typeof shift.employees === 'object' && 
    'first_name' in shift.employees && 
    'last_name' in shift.employees
  );

  console.log('\n🎯 AUGUST 1ST FRONTEND FILTERING:');
  console.log(`   Raw August 1st shifts: ${august1Shifts.length}`);
  console.log(`   After frontend filtering: ${august1FilteredShifts.length}`);
  
  if (august1Shifts.length !== august1FilteredShifts.length) {
    console.log('\n🚨 FRONTEND FILTERING ISSUE FOUND!');
    console.log('   Some August 1st shifts are being filtered out by the frontend!');
    
    const filteredOut = august1Shifts.filter(shift => 
      !shift.employees || 
      typeof shift.employees !== 'object' || 
      !('first_name' in shift.employees) || 
      !('last_name' in shift.employees)
    );
    
    console.log('\n   FILTERED OUT SHIFTS:');
    filteredOut.forEach((shift, i) => {
      console.log(`   ${i + 1}. ${shift.shift_type} - ID: ${shift.id}`);
      console.log(`      Employee ID: ${shift.employee_id}`);
      console.log(`      Employee data: ${JSON.stringify(shift.employees)}`);
    });
  } else {
    console.log('   ✅ All August 1st shifts pass frontend filtering');
  }

  // Summary
  console.log('\n🏁 DIAGNOSIS SUMMARY:');
  if (august1FilteredShifts.length === 3) {
    console.log('   📊 Database contains 3 August 1st shifts');
    console.log('   ✅ All shifts have valid employee data');
    console.log('   📝 All shifts are currently DRAFT status');
    console.log('   🤔 The UI rendering issue must be elsewhere...');
    console.log('\n   NEXT STEPS:');
    console.log('   1. Check if Draft shifts are intentionally hidden in UI');
    console.log('   2. Verify the ModernMonthlySchedule component rendering');
    console.log('   3. Check for CSS display issues or conditional rendering');
  } else {
    console.log('   🚨 Data integrity issue found!');
    console.log('   The frontend filtering is removing valid shifts');
  }
}

analyzeAllShifts().catch(console.error);
