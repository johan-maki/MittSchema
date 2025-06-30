#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const schedulerUrl = process.env.VITE_SCHEDULER_API_URL

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🧪 Testing Gurobi schedule generation with Render backend...')
console.log('===============================================')
console.log(`🌍 Scheduler URL: ${schedulerUrl}`)
console.log('')

// Test data for July 2025
const testData = {
  start_date: '2025-07-01',
  end_date: '2025-07-31',
  department: 'Akutmottagning',
  min_staff_per_shift: 1,
  min_experience_per_shift: 1,
  include_weekends: true,
  random_seed: Math.floor(Math.random() * 1000000)
};

console.log('📊 Test parameters:')
console.log(JSON.stringify(testData, null, 2))
console.log('')

try {
  console.log('📞 Calling external Gurobi backend on Render...')
  const response = await fetch(`${schedulerUrl}/optimize-schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, response.statusText);
    console.error('Response:', errorText);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ SUCCESS! External Gurobi backend response:')
  console.log('============================================')
  
  // Analyze the results
  const schedule = result.schedule || [];
  const statistics = result.statistics || {};
  const coverage = statistics.coverage || {};
  
  console.log(`📊 SCHEDULE STATISTICS:`)
  console.log(`  Total shifts generated: ${schedule.length}`)
  console.log(`  Coverage: ${coverage.coverage_percentage || 0}%`)
  console.log(`  Filled shifts: ${coverage.filled_shifts || 0}`)
  console.log(`  Total shifts: ${coverage.total_shifts || 0}`)
  
  // Check if we have the critical boundary dates
  const boundaryDates = ['2025-07-01', '2025-07-31'];
  console.log('')
  console.log('🎯 CRITICAL BOUNDARY DATES CHECK:')
  boundaryDates.forEach(date => {
    const shiftsForDate = schedule.filter(s => s.date === date);
    console.log(`  ${date}: ${shiftsForDate.length} shifts`);
    if (shiftsForDate.length > 0) {
      shiftsForDate.forEach(shift => {
        console.log(`    ${shift.shift_type.toUpperCase()}: ${shift.employee_name} (${shift.start_time} - ${shift.end_time})`);
      });
    } else {
      console.log(`    ❌ NO SHIFTS FOUND FOR ${date}!`);
    }
  });
  
  // Check night shifts
  const nightShifts = schedule.filter(s => s.shift_type === 'night');
  console.log('')
  console.log(`🌙 NIGHT SHIFTS: ${nightShifts.length} total`)
  
  // Check first night (June 30 -> July 1)
  const firstNight = nightShifts.find(s => s.date === '2025-06-30' || (s.date === '2025-07-01' && s.shift_type === 'night'));
  if (firstNight) {
    console.log(`  ✅ First night covered: ${firstNight.employee_name} on ${firstNight.date}`);
  } else {
    console.log(`  ❌ First night (June 30/July 1) NOT covered!`);
  }
  
  // Check last night (July 31 -> August 1)
  const lastNight = nightShifts.find(s => s.date === '2025-07-31');
  if (lastNight) {
    console.log(`  ✅ Last night covered: ${lastNight.employee_name} on ${lastNight.date}`);
  } else {
    console.log(`  ❌ Last night (July 31) NOT covered!`);
  }
  
  console.log('')
  console.log('🎉 External Gurobi backend test completed!');
  console.log('Now the system is using the correct Render backend instead of localhost.');
  
} catch (error) {
  console.error('❌ Error testing external Gurobi backend:', error.message);
  console.error('Full error:', error);
  
  if (error.message.includes('fetch')) {
    console.log('')
    console.log('💡 This might be a network connectivity issue.');
    console.log('Please check:')
    console.log('  1. Your internet connection')
    console.log('  2. That the Render service is running: https://mittschema-gurobi-backend.onrender.com/health')
    console.log('  3. That there are no firewall restrictions')
  }
}
