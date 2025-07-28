import { createClient } from '@supabase/supabase-js';

// Correct API key provided by user
const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

console.log('🔍 CHECKING AUGUST 31ST NIGHT SHIFT IN SUPABASE DATABASE');
console.log('================================================\n');

// Test 1: Check all shifts for August 31st
console.log('📅 TEST 1: All shifts for August 31st (by date field)');
const { data: dateShifts, error: dateError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .eq('date', '2025-08-31')
  .order('start_time');

if (dateError) {
  console.error('❌ Error:', dateError);
} else {
  console.log(`✅ Found ${dateShifts?.length || 0} shifts for August 31st`);
  if (dateShifts && dateShifts.length > 0) {
    dateShifts.forEach((shift, i) => {
      console.log(`   ${i + 1}. ${shift.shift_type} (${shift.start_time} - ${shift.end_time})`);
    });
  }
}

// Test 2: Check by start_time pattern for August 31st
console.log('\n⏰ TEST 2: Shifts starting on August 31st (by start_time)');
const { data: startTimeShifts, error: startTimeError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .like('start_time', '2025-08-31%')
  .order('start_time');

if (startTimeError) {
  console.error('❌ Error:', startTimeError);
} else {
  console.log(`✅ Found ${startTimeShifts?.length || 0} shifts starting on August 31st`);
  if (startTimeShifts && startTimeShifts.length > 0) {
    startTimeShifts.forEach((shift, i) => {
      console.log(`   ${i + 1}. ${shift.shift_type} starts: ${shift.start_time}`);
    });
  }
}

// Test 3: Specific check for August 31st night shift
console.log('\n🌙 TEST 3: Specific August 31st night shift check');
const { data: nightShift, error: nightError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .eq('date', '2025-08-31')
  .eq('shift_type', 'night')
  .single();

if (nightError) {
  if (nightError.code === 'PGRST116') {
    console.log('❌ NO NIGHT SHIFT FOUND for August 31st');
  } else {
    console.error('❌ Error:', nightError);
  }
} else if (nightShift) {
  console.log('✅ FOUND August 31st night shift!');
  console.log(`   Start: ${nightShift.start_time}`);
  console.log(`   End: ${nightShift.end_time}`);
  console.log(`   Employee ID: ${nightShift.employee_id}`);
}

// Test 4: Check what our extended query would capture
console.log('\n🔍 TEST 4: Extended query simulation (what useShiftData.ts would get)');
const extendedEndDate = '2025-09-01T05:59:59.999Z'; // Our extended query range
const { data: extendedShifts, error: extendedError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .gte('start_time', '2025-07-31T22:00:00.000Z') // Month start 
  .lte('start_time', extendedEndDate) // Extended end
  .order('start_time');

if (extendedError) {
  console.error('❌ Error:', extendedError);
} else {
  console.log(`✅ Extended query would retrieve ${extendedShifts?.length || 0} total shifts`);
  
  // Filter for August 31st specifically
  const august31Extended = extendedShifts?.filter(s => 
    s.start_time && s.start_time.includes('2025-08-31')
  ) || [];
  
  console.log(`✅ August 31st shifts in extended query: ${august31Extended.length}`);
  august31Extended.forEach((shift, i) => {
    console.log(`   ${i + 1}. ${shift.shift_type} (${shift.start_time})`);
  });
  
  // Check specifically for the problematic night shift
  const august31Night = extendedShifts?.find(s => 
    s.start_time && s.start_time.includes('2025-08-31T22:00')
  );
  
  if (august31Night) {
    console.log('\n🎉 SUCCESS: August 31st night shift (22:00) WOULD be captured by extended query!');
  } else {
    console.log('\n🚨 PROBLEM: August 31st night shift (22:00) would still be missing');
  }
}

console.log('\n📊 SUMMARY');
console.log('================================================');
console.log('If August 31st shows only 2 shifts in UI but night shift exists in database,');
console.log('the problem is in the frontend query range, not the database content.');
console.log('Our useShiftData.ts fix should resolve this by extending the query range.');
