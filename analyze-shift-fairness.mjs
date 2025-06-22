impconst supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';rt { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub20iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeShiftDistribution() {
  console.log('📊 Analyzing shift distribution and fairness...');
  
  // Get all shifts from the current generated schedule
  const { data: shifts, error } = await supabase
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
    .gte('start_time', '2025-07-01T00:00:00Z')
    .lte('start_time', '2025-07-31T23:59:59Z')
    .order('start_time');
  
  if (error) {
    console.error('❌ Error fetching shifts:', error);
    return;
  }
  
  console.log(`📋 Total shifts analyzed: ${shifts.length}`);
  
  // Analyze by employee
  const employeeStats = {};
  const shiftTypeStats = { day: {}, evening: {}, night: {} };
  const dateStats = {};
  
  shifts.forEach(shift => {
    const employeeName = shift.profiles ? 
      `${shift.profiles.first_name} ${shift.profiles.last_name}` : 
      'Unknown';
    const date = shift.start_time.split('T')[0];
    
    // Employee totals
    if (!employeeStats[employeeName]) {
      employeeStats[employeeName] = { 
        total: 0, 
        day: 0, 
        evening: 0, 
        night: 0,
        dates: new Set()
      };
    }
    employeeStats[employeeName].total++;
    employeeStats[employeeName][shift.shift_type]++;
    employeeStats[employeeName].dates.add(date);
    
    // Shift type distribution
    if (!shiftTypeStats[shift.shift_type][employeeName]) {
      shiftTypeStats[shift.shift_type][employeeName] = 0;
    }
    shiftTypeStats[shift.shift_type][employeeName]++;
    
    // Date coverage
    if (!dateStats[date]) {
      dateStats[date] = { day: 0, evening: 0, night: 0, total: 0 };
    }
    dateStats[date][shift.shift_type]++;
    dateStats[date].total++;
  });
  
  console.log('\n👥 Employee Distribution:');
  Object.entries(employeeStats)
    .sort(([,a], [,b]) => b.total - a.total)
    .forEach(([name, stats]) => {
      console.log(`${name}: ${stats.total} total (${stats.day} day, ${stats.evening} evening, ${stats.night} night) - ${stats.dates.size} unique dates`);
    });
  
  console.log('\n📊 Fairness Analysis:');
  const totals = Object.values(employeeStats).map(s => s.total);
  const dayTotals = Object.values(employeeStats).map(s => s.day);
  const eveningTotals = Object.values(employeeStats).map(s => s.evening);
  const nightTotals = Object.values(employeeStats).map(s => s.night);
  
  console.log(`Total shifts range: ${Math.min(...totals)} - ${Math.max(...totals)} (difference: ${Math.max(...totals) - Math.min(...totals)})`);
  console.log(`Day shifts range: ${Math.min(...dayTotals)} - ${Math.max(...dayTotals)} (difference: ${Math.max(...dayTotals) - Math.min(...dayTotals)})`);
  console.log(`Evening shifts range: ${Math.min(...eveningTotals)} - ${Math.max(...eveningTotals)} (difference: ${Math.max(...eveningTotals) - Math.min(...eveningTotals)})`);
  console.log(`Night shifts range: ${Math.min(...nightTotals)} - ${Math.max(...nightTotals)} (difference: ${Math.max(...nightTotals) - Math.min(...nightTotals)})`);
  
  console.log('\n🌙 First Night Issue Check:');
  const firstNight = shifts.find(s => s.shift_type === 'night');
  if (firstNight) {
    console.log(`First night shift: ${firstNight.start_time} assigned to ${firstNight.profiles?.first_name} ${firstNight.profiles?.last_name}`);
  } else {
    console.log('❌ NO NIGHT SHIFTS FOUND AT ALL!');
  }
  
  // Check for missing shifts on specific dates
  console.log('\n📅 Date Coverage Issues:');
  Object.entries(dateStats)
    .sort()
    .forEach(([date, stats]) => {
      if (stats.total < 3) {
        console.log(`⚠️  ${date}: Only ${stats.total} shifts (${stats.day} day, ${stats.evening} evening, ${stats.night} night)`);
      }
    });
  
  // Check July 1st specifically
  const july1 = dateStats['2025-07-01'];
  if (july1) {
    console.log(`\n🔍 July 1st analysis: ${july1.total} shifts (${july1.day} day, ${july1.evening} evening, ${july1.night} night)`);
  } else {
    console.log('\n❌ NO SHIFTS FOUND FOR JULY 1st!');
  }
}

analyzeShiftDistribution().catch(console.error);
