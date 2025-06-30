import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Analyze just the current week to match the screenshot
const { data: shifts, error } = await supabase
  .from('shifts')
  .select(`
    id, 
    start_time, 
    shift_type, 
    employee_id,
    profiles:employees!shifts_employee_id_fkey(first_name, last_name)
  `)
  .gte('start_time', '2025-07-07T00:00:00Z')
  .lte('start_time', '2025-07-13T23:59:59Z')
  .order('start_time');

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log(`📋 Week 28 shifts analyzed: ${shifts.length}`);

// Employee stats
const employeeStats = {};
shifts.forEach(shift => {
  const name = shift.profiles ? 
    `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
    'Unknown';
  
  if (!employeeStats[name]) {
    employeeStats[name] = { total: 0, day: 0, evening: 0, night: 0 };
  }
  employeeStats[name].total++;
  employeeStats[name][shift.shift_type]++;
});

console.log('\n👥 Employee Distribution:');
Object.entries(employeeStats)
  .sort(([,a], [,b]) => b.total - a.total)
  .forEach(([name, stats]) => {
    console.log(`${name}: ${stats.total} total (${stats.day} day, ${stats.evening} evening, ${stats.night} night)`);
  });

// Fairness analysis
const totals = Object.values(employeeStats).map(s => s.total);
const dayTotals = Object.values(employeeStats).map(s => s.day);
const eveningTotals = Object.values(employeeStats).map(s => s.evening);
const nightTotals = Object.values(employeeStats).map(s => s.night);

console.log('\n📊 Fairness Analysis:');
console.log(`Total range: ${Math.min(...totals)} - ${Math.max(...totals)} (diff: ${Math.max(...totals) - Math.min(...totals)})`);
console.log(`Day range: ${Math.min(...dayTotals)} - ${Math.max(...dayTotals)} (diff: ${Math.max(...dayTotals) - Math.min(...dayTotals)})`);
console.log(`Evening range: ${Math.min(...eveningTotals)} - ${Math.max(...eveningTotals)} (diff: ${Math.max(...eveningTotals) - Math.min(...eveningTotals)})`);
console.log(`Night range: ${Math.min(...nightTotals)} - ${Math.max(...nightTotals)} (diff: ${Math.max(...nightTotals) - Math.min(...nightTotals)})`);

// Date analysis
const dateStats = {};
shifts.forEach(shift => {
  const date = shift.start_time.split('T')[0];
  if (!dateStats[date]) {
    dateStats[date] = { day: 0, evening: 0, night: 0 };
  }
  dateStats[date][shift.shift_type]++;
});

console.log('\n📅 Daily Coverage:');
Object.entries(dateStats).sort().forEach(([date, stats]) => {
  const total = stats.day + stats.evening + stats.night;
  const dayName = new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' });
  console.log(`${date} (${dayName}): ${total} shifts (${stats.day}d, ${stats.evening}e, ${stats.night}n)`);
  if (total < 3) {
    console.log(`  ⚠️  MISSING SHIFTS!`);
  }
});
