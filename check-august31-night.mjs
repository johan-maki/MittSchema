import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzg5MjIsImV4cCI6MjA1MTM1NDkyMn0.bNdW8TT5LtIjHcMFFgYBRGJHcMFNMQwW0RqWwDbJRzY'
);

// Check if August 31st night shift exists in database
console.log('🔍 CHECKING AUGUST 31 NIGHT SHIFT IN DATABASE...');

// Method 1: Check by date field
const { data: dateData, error: dateError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .eq('date', '2025-08-31')
  .eq('shift_type', 'night')
  .order('start_time');
  
console.log('📅 BY DATE FIELD (date = 2025-08-31 AND shift_type = night):');
console.log('  Count:', dateData?.length || 0);
if (dateData && dateData.length > 0) {
  dateData.forEach((shift, i) => {
    console.log(`  Shift ${i + 1}:`, {
      id: shift.id,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      employee_id: shift.employee_id
    });
  });
} else {
  console.log('  No shifts found');
  if (dateError) console.error('  Error:', dateError);
}

// Method 2: Check by start_time pattern
const { data: timeData, error: timeError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .like('start_time', '2025-08-31%')
  .eq('shift_type', 'night')
  .order('start_time');
  
console.log('\n⏰ BY START_TIME PATTERN (start_time LIKE 2025-08-31% AND shift_type = night):');
console.log('  Count:', timeData?.length || 0);
if (timeData && timeData.length > 0) {
  timeData.forEach((shift, i) => {
    console.log(`  Shift ${i + 1}:`, {
      id: shift.id,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      employee_id: shift.employee_id
    });
  });
} else {
  console.log('  No shifts found');
  if (timeError) console.error('  Error:', timeError);
}

// Method 3: Get all shifts for August 31st
const { data: allData, error: allError } = await supabase
  .from('shifts')
  .select('id, date, start_time, end_time, shift_type, employee_id')
  .like('start_time', '2025-08-31%')
  .order('start_time');
  
console.log('\n📋 ALL SHIFTS FOR AUGUST 31st (start_time LIKE 2025-08-31%):');
console.log('  Count:', allData?.length || 0);
if (allData && allData.length > 0) {
  allData.forEach((shift, i) => {
    console.log(`  Shift ${i + 1}:`, {
      id: shift.id,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      employee_id: shift.employee_id
    });
  });
} else {
  console.log('  No shifts found for August 31st');
  if (allError) console.error('  Error:', allError);
}

console.log('\n✅ Database check complete');
