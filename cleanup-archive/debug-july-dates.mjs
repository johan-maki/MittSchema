import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Analyzing all July dates in database...');

const { data: shifts, error } = await supabase
  .from('shifts')
  .select('date, shift_type, start_time, is_published')
  .gte('date', '2025-07-01')
  .lte('date', '2025-07-31')
  .order('date', { ascending: true })
  .order('start_time', { ascending: true });

if (error) {
  console.error('❌ Error:', error);
} else {
  console.log(`📊 Found ${shifts.length} shifts in July 2025`);
  
  // Group by date
  const byDate = {};
  shifts.forEach(shift => {
    if (!byDate[shift.date]) byDate[shift.date] = [];
    byDate[shift.date].push(shift);
  });
  
  const dates = Object.keys(byDate).sort();
  console.log(`📅 Date range in DB: ${dates[0]} to ${dates[dates.length - 1]}`);
  
  // Check for July 31 specifically
  const july31 = byDate['2025-07-31'] || [];
  console.log(`\n🔍 July 31 analysis:`);
  console.log(`  Shifts found: ${july31.length}`);
  if (july31.length > 0) {
    july31.forEach(shift => {
      console.log(`    ${shift.shift_type}: ${shift.start_time} (published: ${shift.is_published})`);
    });
  }
  
  // Check for missing dates in July
  console.log('\n🔍 Missing dates in July:');
  for (let day = 1; day <= 31; day++) {
    const dateStr = `2025-07-${day.toString().padStart(2, '0')}`;
    if (!byDate[dateStr]) {
      console.log(`  ❌ Missing: ${dateStr}`);
    }
  }
  
  // Show stats for end of month
  console.log('\n📊 End of month coverage:');
  const endDates = ['2025-07-29', '2025-07-30', '2025-07-31'];
  endDates.forEach(date => {
    const dayShifts = byDate[date] || [];
    console.log(`  ${date}: ${dayShifts.length} shifts`);
  });
}
