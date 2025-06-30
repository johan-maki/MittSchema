import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mzeztfhkvtmxsusedgpa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16ZXp0ZmhrdnRteHN1c2VkZ3BhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5ODI5MDMsImV4cCI6MjA1MDU1ODkwM30.dLe-m6dGdGBhfhcJ9mLTkfJnv6wswlITFVNO8VHXCSU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugScheduleEnd() {
  console.log('🔍 Analyzing schedule end dates...\n');

  // Get all shifts ordered by date
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('*')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching shifts:', error);
    return;
  }

  console.log(`📊 Found ${shifts.length} total shifts\n`);

  // Group by date
  const shiftsByDate = {};
  shifts.forEach(shift => {
    const date = shift.start_time.split('T')[0];
    if (!shiftsByDate[date]) {
      shiftsByDate[date] = [];
    }
    shiftsByDate[date].push(shift);
  });

  const dates = Object.keys(shiftsByDate).sort();
  console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}\n`);

  // Check last few days
  console.log('🔍 Last 5 days in schedule:');
  const lastDates = dates.slice(-5);
  lastDates.forEach(date => {
    const dayShifts = shiftsByDate[date];
    console.log(`  ${date}: ${dayShifts.length} shifts`);
    dayShifts.forEach(shift => {
      console.log(`    ${shift.shift_type}: ${shift.start_time} to ${shift.end_time}`);
    });
  });

  // Check if July 31 should exist
  const july31 = '2025-07-31';
  console.log(`\n🔍 Checking for ${july31}:`);
  if (shiftsByDate[july31]) {
    console.log(`✅ Found ${shiftsByDate[july31].length} shifts for ${july31}`);
  } else {
    console.log(`❌ No shifts found for ${july31}`);
    
    // Check what the next day after last scheduled day should be
    const lastDate = dates[dates.length - 1];
    const lastDateObj = new Date(lastDate);
    const nextDay = new Date(lastDateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    console.log(`📅 Last scheduled date: ${lastDate}`);
    console.log(`📅 Next day would be: ${nextDayStr}`);
    
    if (nextDayStr === july31) {
      console.log('⚠️  July 31 is missing from the schedule!');
    }
  }

  // Check month boundaries
  console.log('\n📊 Shifts by month:');
  const monthCounts = {};
  dates.forEach(date => {
    const month = date.substring(0, 7); // YYYY-MM
    monthCounts[month] = (monthCounts[month] || 0) + shiftsByDate[date].length;
  });
  
  Object.keys(monthCounts).sort().forEach(month => {
    console.log(`  ${month}: ${monthCounts[month]} shifts`);
  });

  // Check for weekend patterns in July
  console.log('\n🔍 Weekend analysis for July:');
  const julyDates = dates.filter(date => date.startsWith('2025-07'));
  julyDates.forEach(date => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
      console.log(`  ${date} (${dayName}): ${shiftsByDate[date].length} shifts`);
    }
  });
}

debugScheduleEnd().catch(console.error);
