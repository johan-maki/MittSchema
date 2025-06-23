#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGurobiScheduleGeneration() {
  console.log('🧪 Testing Gurobi schedule generation for a full month...\n')
  
  try {
    // Test generating a schedule for August 2025 (full month)
    const startDate = '2025-08-01'
    const endDate = '2025-08-31'
    
    console.log(`📅 Requesting schedule from ${startDate} to ${endDate}`)
    console.log(`Expected days: ${new Date(endDate).getDate()} days`)
    console.log(`Expected total shifts: ${new Date(endDate).getDate() * 3} shifts`)
    
    // Get employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')

    if (empError) {
      console.error('❌ Error fetching employees:', empError)
      return
    }

    console.log(`👥 Found ${employees.length} employees`)
    
    // Call Gurobi API
    const response = await fetch('http://localhost:8080/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employees: employees,
        start_date: startDate,
        end_date: endDate,
        min_staff_per_shift: 1,
        min_experience_per_shift: 1,
        include_weekends: true,
        random_seed: 42
      })
    })

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      return
    }

    const result = await response.json()
    
    console.log('\n� RAW RESPONSE:')
    console.log(JSON.stringify(result, null, 2))
    
    console.log('\n�📊 GUROBI OPTIMIZATION RESULTS:')
    console.log('===============================')
    console.log(`✅ Optimizer: ${result.optimizer}`)
    console.log(`📈 Objective value: ${result.objective_value}`)
    console.log(`🎯 Coverage: ${result.statistics?.coverage?.coverage_percentage || 'N/A'}%`)
    console.log(`📅 Generated shifts: ${result.schedule?.length || 0}`)
    
    // Group shifts by date
    const shiftsByDate = {}
    result.schedule.forEach(shift => {
      const date = shift.start_time.split('T')[0]
      if (!shiftsByDate[date]) {
        shiftsByDate[date] = []
      }
      shiftsByDate[date].push(shift)
    })
    
    const dates = Object.keys(shiftsByDate).sort()
    console.log(`📅 Date range in result: ${dates[0]} to ${dates[dates.length - 1]}`)
    console.log(`📆 Days covered: ${dates.length}`)
    
    // Check if July 31 is missing
    const expectedDates = []
    let currentDate = new Date(startDate)
    const lastDate = new Date(endDate)
    
    while (currentDate <= lastDate) {
      expectedDates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log(`📋 Expected dates: ${expectedDates.length}`)
    console.log(`📋 First expected: ${expectedDates[0]}`)
    console.log(`📋 Last expected: ${expectedDates[expectedDates.length - 1]}`)
    
    const missingDates = expectedDates.filter(date => !shiftsByDate[date])
    
    if (missingDates.length > 0) {
      console.log(`🚨 MISSING DATES (${missingDates.length}):`)
      missingDates.forEach(date => {
        console.log(`   ${date}`)
      })
    } else {
      console.log('✅ All expected dates covered!')
    }
    
    // Check fairness
    console.log('\n⚖️ FAIRNESS ANALYSIS:')
    console.log('=====================')
    console.log('Total shifts per employee:', result.statistics.fairness.total_shifts)
    console.log('Shift type distribution:')
    Object.entries(result.statistics.fairness.shift_types).forEach(([type, stats]) => {
      console.log(`  ${type}: min=${stats.min}, max=${stats.max}, range=${stats.range}`)
    })
    
    // Show first and last few days
    console.log('\n📅 FIRST 3 DAYS:')
    dates.slice(0, 3).forEach(date => {
      console.log(`${date}: ${shiftsByDate[date].length} shifts`)
      shiftsByDate[date].forEach(shift => {
        const startTime = shift.start_time.split('T')[1].substring(0, 5)
        console.log(`  ${startTime} - ${shift.employee_name}`)
      })
    })
    
    console.log('\n📅 LAST 3 DAYS:')
    dates.slice(-3).forEach(date => {
      console.log(`${date}: ${shiftsByDate[date].length} shifts`)
      shiftsByDate[date].forEach(shift => {
        const startTime = shift.start_time.split('T')[1].substring(0, 5)
        console.log(`  ${startTime} - ${shift.employee_name}`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

testGurobiScheduleGeneration()
