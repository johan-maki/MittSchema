#!/usr/bin/env node

import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const BACKEND_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function debugLastDay() {
  try {
    console.log('🔍 Debugging last day issue...\n');
    
    // Generate a test schedule
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    
    console.log(`📅 Generating schedule from ${startDate} to ${endDate}`);
    
    const response = await fetch(`${BACKEND_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate
        })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Schedule generated successfully\n');
    
    // Analyze the schedule
    const shifts = data.schedule || [];
    console.log(`📊 Total shifts: ${shifts.length}`);
    
    // Group shifts by date
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const date = shift.date.split('T')[0];
      if (!shiftsByDate[date]) {
        shiftsByDate[date] = [];
      }
      shiftsByDate[date].push(shift);
    });
    
    // Check dates around the end
    const dates = Object.keys(shiftsByDate).sort();
    console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}\n`);
    
    // Focus on the last few days
    const lastFewDays = dates.slice(-5);
    console.log('🔍 Last 5 days with shifts:');
    lastFewDays.forEach(date => {
      const dayShifts = shiftsByDate[date];
      console.log(`  ${date}: ${dayShifts.length} shifts`);
      dayShifts.forEach(shift => {
        console.log(`    ${shift.shift_type}: ${shift.employee_name}`);
      });
    });
    
    // Check if July 31st has any shifts
    console.log('\n🎯 Checking July 31st specifically:');
    const july31 = '2025-07-31';
    if (shiftsByDate[july31]) {
      console.log(`✅ Found ${shiftsByDate[july31].length} shifts on July 31st:`);
      shiftsByDate[july31].forEach(shift => {
        console.log(`  ${shift.shift_type}: ${shift.employee_name}`);
      });
    } else {
      console.log('❌ No shifts found on July 31st!');
    }
    
    // Show optimization stats
    console.log('\n📈 Optimization stats:');
    console.log(`  Coverage: ${data.coverage_stats?.coverage_percentage || 'N/A'}%`);
    console.log(`  Filled shifts: ${data.coverage_stats?.filled_shifts || 'N/A'}`);
    console.log(`  Total shifts: ${data.coverage_stats?.total_shifts || 'N/A'}`);
    
    // Show cost information
    console.log('\n💰 Cost information:');
    console.log(`  Total cost: ${data.total_cost || 'N/A'} SEK`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLastDay();
