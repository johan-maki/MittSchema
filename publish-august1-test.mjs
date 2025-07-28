#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function publishAugust1Shifts() {
  console.log('📢 Publishing August 1st shifts to test UI visibility\n');
  
  // Get August 1st shifts
  const { data: august1Shifts, error: fetchError } = await supabase
    .from('shifts')
    .select('id, shift_type, start_time, employees!shifts_employee_id_fkey(first_name, last_name)')
    .gte('start_time', '2025-08-01T00:00:00.000Z')
    .lt('start_time', '2025-08-02T00:00:00.000Z')
    .order('start_time', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching August 1st shifts:', fetchError);
    return;
  }

  if (!august1Shifts || august1Shifts.length === 0) {
    console.log('❌ No August 1st shifts found to publish');
    return;
  }

  console.log(`📊 Found ${august1Shifts.length} August 1st shifts to publish:`);
  august1Shifts.forEach((shift, i) => {
    const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
    console.log(`   ${i + 1}. ${shift.shift_type.toUpperCase()}: ${employee}`);
  });

  // Publish all August 1st shifts
  const shiftIds = august1Shifts.map(shift => shift.id);
  const { data: updatedShifts, error: updateError } = await supabase
    .from('shifts')
    .update({ is_published: true })
    .in('id', shiftIds)
    .select('id, shift_type, employees!shifts_employee_id_fkey(first_name, last_name)');

  if (updateError) {
    console.error('❌ Error publishing shifts:', updateError);
    return;
  }

  console.log('\n✅ Successfully published August 1st shifts!');
  console.log('🎯 Now check the frontend UI to see if Erik\'s night shift appears');
  
  console.log('\n📋 Published shifts:');
  updatedShifts?.forEach((shift, i) => {
    const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unknown';
    console.log(`   ${i + 1}. ${shift.shift_type.toUpperCase()}: ${employee} - Now PUBLISHED ✅`);
  });

  console.log('\n🔍 TEST INSTRUCTIONS:');
  console.log('1. Go to the frontend UI (mitt-schema.vercel.app)');
  console.log('2. Navigate to August 2025');
  console.log('3. Look at August 1st');
  console.log('4. Check if Erik Svensson\'s night shift is now visible');
  console.log('5. All three shifts should now have green publication indicators');
}

publishAugust1Shifts().catch(console.error);
