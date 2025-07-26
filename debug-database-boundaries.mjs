#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMonthBoundaryIssues() {
  console.log('🔍 Analyzing month boundary issues in database...\n');
  
  try {
    // Get all shifts for analysis
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select(`
        *,
        employees:employee_id (
          first_name,
          last_name,
          role
        )
      `)
      .gte('date', '2025-06-01')
      .lte('date', '2025-09-30')
      .order('date')
      .order('start_time');

    if (error) {
      console.error('❌ Error fetching shifts:', error);
      return;
    }

    console.log(`📊 Found ${shifts.length} total shifts from June-September 2025\n`);
    
    // Group by month and analyze
    const monthlyData = {};
    
    for (const shift of shifts) {
      const date = shift.date;
      const monthKey = date.substring(0, 7); // YYYY-MM format
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
      
      if (!monthlyData[monthKey][date]) {
        monthlyData[monthKey][date] = [];
      }
      
      monthlyData[monthKey][date].push(shift);
    }
    
    // Analyze each month
    for (const [monthKey, dates] of Object.entries(monthlyData)) {
      console.log(`📅 ${monthKey}:`);
      
      const sortedDates = Object.keys(dates).sort();
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      console.log(`   📊 ${sortedDates.length} unique dates`);
      console.log(`   🗓️  Range: ${firstDate} to ${lastDate}`);
      
      // Check first day
      const firstDayShifts = dates[firstDate];
      console.log(`   🌅 First day (${firstDate}): ${firstDayShifts.length} shifts`);
      if (firstDayShifts.length < 3) {
        console.log(`      ⚠️  Expected 3 shifts, found ${firstDayShifts.length}`);
        firstDayShifts.forEach(shift => {
          const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unassigned';
          console.log(`         ${shift.shift_type}: ${shift.start_time.split('T')[1].substring(0,5)}-${shift.end_time.split('T')[1].substring(0,5)} → ${employee}`);
        });
      }
      
      // Check last day
      const lastDayShifts = dates[lastDate];
      console.log(`   🌇 Last day (${lastDate}): ${lastDayShifts.length} shifts`);
      if (lastDayShifts.length < 3) {
        console.log(`      ⚠️  Expected 3 shifts, found ${lastDayShifts.length}`);
        lastDayShifts.forEach(shift => {
          const employee = shift.employees ? `${shift.employees.first_name} ${shift.employees.last_name}` : 'Unassigned';
          console.log(`         ${shift.shift_type}: ${shift.start_time.split('T')[1].substring(0,5)}-${shift.end_time.split('T')[1].substring(0,5)} → ${employee}`);
        });
      }
      
      // Find days with missing shifts
      const incompleteDays = sortedDates.filter(date => dates[date].length < 3);
      if (incompleteDays.length > 0) {
        console.log(`   ❌ Days with < 3 shifts: ${incompleteDays.join(', ')}`);
      }
      
      console.log('');
    }
    
    // Check for specific natt pass issues
    console.log('🌙 Analyzing night shift patterns:');
    const nightShifts = shifts.filter(s => s.shift_type === 'natt');
    console.log(`   📊 Total night shifts: ${nightShifts.length}`);
    
    // Group night shifts by date
    const nightByDate = {};
    for (const shift of nightShifts) {
      const date = shift.date;
      if (!nightByDate[date]) {
        nightByDate[date] = [];
      }
      nightByDate[date].push(shift);
    }
    
    // Find dates without night shifts
    const allDates = [...new Set(shifts.map(s => s.date))].sort();
    const datesWithoutNight = allDates.filter(date => !nightByDate[date]);
    
    if (datesWithoutNight.length > 0) {
      console.log(`   ❌ Dates without night shifts: ${datesWithoutNight.join(', ')}`);
    } else {
      console.log(`   ✅ All dates have night shifts`);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

analyzeMonthBoundaryIssues();
