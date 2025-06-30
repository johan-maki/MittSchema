import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMondayShifts() {
  console.log('🔍 Investigating Monday shifts (week 28: 7-13 July 2025)...');
  
  // Check shifts for the entire week 28
  const { data: weekShifts, error } = await supabase
    .from('shifts')
    .select(`
      id, 
      start_time, 
      end_time, 
      shift_type, 
      is_published, 
      employee_id,
      profiles:employees!shifts_employee_id_fkey(first_name, last_name)
    `)
    .gte('start_time', '2025-07-07T00:00:00Z')
    .lte('start_time', '2025-07-13T23:59:59Z')
    .order('start_time');
  
  if (error) {
    console.error('❌ Error fetching week shifts:', error);
    return;
  }
  
  console.log(`📊 Total shifts found for week 28: ${weekShifts.length}`);
  
  // Group by date
  const shiftsByDate = {};
  weekShifts.forEach(shift => {
    const date = shift.start_time.split('T')[0];
    if (!shiftsByDate[date]) {
      shiftsByDate[date] = [];
    }
    shiftsByDate[date].push(shift);
  });
  
  console.log('\n📅 Shifts by date:');
  const weekDates = [
    '2025-07-07', // Monday
    '2025-07-08', // Tuesday  
    '2025-07-09', // Wednesday
    '2025-07-10', // Thursday
    '2025-07-11', // Friday
    '2025-07-12', // Saturday
    '2025-07-13'  // Sunday
  ];
  
  weekDates.forEach(date => {
    const shifts = shiftsByDate[date] || [];
    const dayName = new Date(date).toLocaleDateString('sv-SE', { weekday: 'long' });
    console.log(`${date} (${dayName}): ${shifts.length} shifts`);
    
    if (shifts.length > 0) {
      shifts.forEach(shift => {
        const employeeName = shift.profiles ? 
          `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
          'Unknown Employee';
        const time = shift.start_time.substring(11, 16);
        console.log(`  - ${time} ${shift.shift_type} (${employeeName}) ${shift.is_published ? '[PUBLISHED]' : '[UNPUBLISHED]'}`);
      });
    } else {
      console.log(`  ⚠️  NO SHIFTS FOUND FOR ${dayName.toUpperCase()}`);
    }
  });
  
  // Check specifically for Monday shifts in the database
  console.log('\n🔍 Detailed Monday check:');
  const { data: mondayShifts, error: mondayError } = await supabase
    .from('shifts')
    .select('*')
    .gte('start_time', '2025-07-07T00:00:00Z')
    .lt('start_time', '2025-07-08T00:00:00Z')
    .order('start_time');
    
  if (mondayError) {
    console.error('❌ Error fetching Monday shifts:', mondayError);
    return;
  }
  
  console.log(`Monday raw shifts in database: ${mondayShifts.length}`);
  mondayShifts.forEach(shift => {
    console.log(`  - ID: ${shift.id.substring(0, 8)}... Time: ${shift.start_time} Type: ${shift.shift_type} Published: ${shift.is_published}`);
  });
}

checkMondayShifts().catch(console.error);
