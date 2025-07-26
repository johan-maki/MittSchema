#!/usr/bin/env node

// Quick test to see current August shifts for Andreas
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function checkCurrentSchedule() {
  console.log('🔍 Checking current August shifts...');

  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id, employee_id, shift_type, start_time,
      profiles:employees!shifts_employee_id_fkey(first_name, last_name)
    `)
    .gte('start_time', '2025-08-01T00:00:00')
    .lt('start_time', '2025-09-01T00:00:00')
    .order('start_time');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${shifts.length} shifts in August`);

  // Group by employee
  const shiftsByEmployee = {};
  shifts.forEach(shift => {
    const name = shift.profiles ? 
      `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
      'Unknown';
    
    if (!shiftsByEmployee[name]) {
      shiftsByEmployee[name] = [];
    }
    shiftsByEmployee[name].push(shift);
  });

  console.log('\n👤 Current shift distribution:');
  Object.entries(shiftsByEmployee)
    .sort(([,a], [,b]) => b.length - a.length)
    .forEach(([name, shifts]) => {
      console.log(`   ${name}: ${shifts.length} shifts`);
    });

  // Specifically check for Andreas
  const andreasShifts = shifts.filter(s => s.employee_id === 'cb319cf9-6688-4d57-b6e6-8a62086b7630');
  console.log(`\n🎯 Andreas Lundquist: ${andreasShifts.length} shifts`);

  if (andreasShifts.length === 0) {
    console.log('❌ CONFIRMED: Andreas has zero shifts in current schedule');
  } else {
    console.log('✅ Andreas has shifts:');
    andreasShifts.forEach(shift => {
      const date = shift.start_time.split('T')[0];
      console.log(`   - ${date}: ${shift.shift_type}`);
    });
  }
}

checkCurrentSchedule();
