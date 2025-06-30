import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Investigating missing shifts on June 30 and July 31...');

// Check shifts around the problematic dates
const { data: shifts, error } = await supabase
  .from('shifts')
  .select(`
    id, 
    start_time, 
    shift_type, 
    employee_id,
    profiles:employees!shifts_employee_id_fkey(first_name, last_name)
  `)
  .gte('start_time', '2025-06-29T00:00:00Z')
  .lte('start_time', '2025-07-31T23:59:59Z')
  .order('start_time');

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`📋 Found ${shifts.length} shifts in period June 29 - July 31`);

// Group by date
const dateStats = {};
shifts.forEach(shift => {
  const date = shift.start_time.split('T')[0];
  if (!dateStats[date]) {
    dateStats[date] = { day: [], evening: [], night: [], total: 0 };
  }
  
  const employeeName = shift.profiles ? 
    `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
    'Unknown';
    
  dateStats[date][shift.shift_type].push(employeeName);
  dateStats[date].total++;
});

// Focus on problematic dates
const problemDates = ['2025-06-30', '2025-07-31'];

console.log('\n🚨 PROBLEM DATES ANALYSIS:');
problemDates.forEach(date => {
  const stats = dateStats[date];
  if (stats) {
    console.log(`\n📅 ${date}:`);
    console.log(`  Day shifts: ${stats.day.length} (${stats.day.join(', ') || 'NONE'})`);
    console.log(`  Evening shifts: ${stats.evening.length} (${stats.evening.join(', ') || 'NONE'})`);
    console.log(`  Night shifts: ${stats.night.length} (${stats.night.join(', ') || 'NONE'})`);
    console.log(`  Total: ${stats.total}/3 shifts filled`);
    
    if (stats.total < 3) {
      console.log(`  ⚠️  MISSING ${3 - stats.total} SHIFTS!`);
    }
  } else {
    console.log(`\n📅 ${date}: NO SHIFTS FOUND AT ALL!`);
  }
});

// Check surrounding dates for context
console.log('\n📊 SURROUNDING DATES FOR CONTEXT:');
const contextDates = ['2025-06-29', '2025-06-30', '2025-07-01', '2025-07-30', '2025-07-31'];
contextDates.forEach(date => {
  const stats = dateStats[date];
  const dayName = new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' });
  
  if (stats) {
    console.log(`${date} (${dayName}): ${stats.total}/3 shifts (${stats.day.length}d, ${stats.evening.length}e, ${stats.night.length}n)`);
  } else {
    console.log(`${date} (${dayName}): 0/3 shifts - NO DATA`);
  }
});

// Check if there's a pattern - month boundaries?
console.log('\n🔍 MONTH BOUNDARY ANALYSIS:');
console.log('June 30 is last day of June');
console.log('July 31 is last day of July');
console.log('These are month boundary dates - could be a date range calculation issue');

// Check what date range was actually used for generation
console.log('\n📅 DATE RANGE CHECK:');
const firstShift = shifts[0];
const lastShift = shifts[shifts.length - 1];
if (firstShift && lastShift) {
  console.log(`First shift: ${firstShift.start_time}`);
  console.log(`Last shift: ${lastShift.start_time}`);
  
  const firstDate = firstShift.start_time.split('T')[0];
  const lastDate = lastShift.start_time.split('T')[0];
  console.log(`Generated range: ${firstDate} to ${lastDate}`);
}

// Employee load check - maybe some employees are overloaded?
const employeeStats = {};
shifts.forEach(shift => {
  const employeeName = shift.profiles ? 
    `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
    'Unknown';
  
  if (!employeeStats[employeeName]) {
    employeeStats[employeeName] = { total: 0, day: 0, evening: 0, night: 0 };
  }
  employeeStats[employeeName].total++;
  employeeStats[employeeName][shift.shift_type]++;
});

console.log('\n👥 EMPLOYEE WORKLOAD (might show constraint issues):');
Object.entries(employeeStats)
  .sort(([,a], [,b]) => b.total - a.total)
  .forEach(([name, stats]) => {
    console.log(`${name}: ${stats.total} shifts (${stats.day}d, ${stats.evening}e, ${stats.night}n)`);
  });
