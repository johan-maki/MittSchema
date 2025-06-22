import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Analyzing all shifts to understand date distribution...');

// Get all shifts with dates
const { data: shifts, error } = await supabase
  .from('shifts')
  .select(`
    date,
    shift_type,
    start_time,
    end_time,
    profiles:employees!shifts_employee_id_fkey (
      id,
      first_name,
      last_name
    )
  `)
  .order('date', { ascending: true })
  .order('start_time', { ascending: true });

if (error) {
  console.error('❌ Error fetching shifts:', error);
} else {
  console.log(`\n📊 Found ${shifts.length} total shifts`);
  
  // Group by date
  const dateGroups = {};
  shifts.forEach(shift => {
    if (!dateGroups[shift.date]) {
      dateGroups[shift.date] = [];
    }
    dateGroups[shift.date].push(shift);
  });
  
  const dates = Object.keys(dateGroups).sort();
  console.log(`\n📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  console.log(`📊 Total unique dates: ${dates.length}`);
  
  // Check for specific problematic dates
  const problemDates = ['2025-06-30', '2025-07-01', '2025-07-31', '2025-08-01'];
  console.log('\n🔍 Checking problematic dates:');
  problemDates.forEach(date => {
    const shiftsForDate = dateGroups[date] || [];
    console.log(`  ${date}: ${shiftsForDate.length} shifts`);
    if (shiftsForDate.length > 0) {
      shiftsForDate.forEach(shift => {
        const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
        console.log(`    ${shift.shift_type.toUpperCase()}: ${shift.start_time}-${shift.end_time} → ${employee}`);
      });
    }
  });
  
  // Look for gaps in date sequence
  console.log('\n🔍 Looking for date gaps...');
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i-1]);
    const currentDate = new Date(dates[i]);
    const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 1) {
      console.log(`  ⚠️  Gap found: ${dates[i-1]} → ${dates[i]} (${daysDiff} days)`);
      
      // List missing dates
      for (let d = 1; d < daysDiff; d++) {
        const missingDate = new Date(prevDate);
        missingDate.setDate(missingDate.getDate() + d);
        console.log(`    ❌ Missing: ${missingDate.toISOString().split('T')[0]}`);
      }
    }
  }
  
  // Show date distribution by month
  console.log('\n📅 Shifts by month:');
  const monthGroups = {};
  dates.forEach(date => {
    const month = date.substring(0, 7); // YYYY-MM
    if (!monthGroups[month]) {
      monthGroups[month] = 0;
    }
    monthGroups[month] += dateGroups[date].length;
  });
  
  Object.keys(monthGroups).sort().forEach(month => {
    console.log(`  ${month}: ${monthGroups[month]} shifts`);
  });
}
