#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testJulyWeekendFairness() {
  console.log('🧪 Testing July 2025 weekend fairness with 4x weight...\n')
  
  try {
    // Test July 2025 (31 days) 
    const startDate = '2025-07-01'
    const endDate = '2025-07-31'
    
    console.log(`📅 Requesting schedule from ${startDate} to ${endDate}`)
    
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
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
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
    
    console.log('\n📊 GUROBI OPTIMIZATION RESULTS:')
    console.log('===============================')
    console.log(`✅ Optimizer: ${result.optimizer}`)
    console.log(`📈 Objective value: ${result.objective_value}`)
    console.log(`🎯 Coverage: ${result.coverage_stats?.coverage_percentage || 'N/A'}%`)
    console.log(`📅 Generated shifts: ${result.schedule?.length || 0}`)
    
    // Count weekend days in July 2025
    const weekendDays = []
    let currentDate = new Date(startDate)
    const lastDate = new Date(endDate)
    
    while (currentDate <= lastDate) {
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) { // Sunday or Saturday
        weekendDays.push(currentDate.toISOString().split('T')[0])
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    console.log(`\n📅 JULY 2025 WEEKEND ANALYSIS:`)
    console.log(`==============================`)
    console.log(`Total weekend days: ${weekendDays.length}`)
    console.log(`Total weekend shifts needed: ${weekendDays.length * 3}`)
    console.log(`Weekend days: ${weekendDays.join(', ')}`)
    
    // Analyze weekend fairness
    console.log('\n🏖️ WEEKEND FAIRNESS ANALYSIS:')
    console.log('==============================')
    
    if (result.employee_stats) {
      console.log('Weekend shifts per employee:')
      const weekendStats = []
      
      Object.entries(result.employee_stats).forEach(([id, stats]) => {
        console.log(`  ${stats.name}: ${stats.weekend_shifts} weekend shifts`)
        weekendStats.push(stats.weekend_shifts)
      })
      
      const minWeekend = Math.min(...weekendStats)
      const maxWeekend = Math.max(...weekendStats) 
      const avgWeekend = weekendStats.reduce((a, b) => a + b, 0) / weekendStats.length
      const rangeWeekend = maxWeekend - minWeekend
      
      console.log(`\n📊 Weekend fairness summary:`)
      console.log(`   Min: ${minWeekend} shifts`)
      console.log(`   Max: ${maxWeekend} shifts`)
      console.log(`   Avg: ${avgWeekend.toFixed(1)} shifts`)
      console.log(`   Range: ${rangeWeekend} shifts`)
      
      if (rangeWeekend === 0) {
        console.log(`   🎯 PERFECT weekend fairness! (range = 0)`)
      } else if (rangeWeekend <= 1) {
        console.log(`   ✅ Excellent weekend fairness! (range ≤ 1)`)
      } else if (rangeWeekend <= 2) {
        console.log(`   ✅ Good weekend fairness (range ≤ 2)`)
      } else {
        console.log(`   ⚠️  Weekend fairness could be improved (range > 2)`)
      }
    }
    
    // Also analyze total shift fairness
    console.log('\n⚖️ TOTAL SHIFT FAIRNESS:')
    console.log('========================')
    
    if (result.employee_stats) {
      const totalStats = []
      Object.entries(result.employee_stats).forEach(([id, stats]) => {
        console.log(`  ${stats.name}: ${stats.total_shifts} total shifts`)
        totalStats.push(stats.total_shifts)
      })
      
      const minTotal = Math.min(...totalStats)
      const maxTotal = Math.max(...totalStats)
      const avgTotal = totalStats.reduce((a, b) => a + b, 0) / totalStats.length
      const rangeTotal = maxTotal - minTotal
      
      console.log(`\nTotal shift fairness: min=${minTotal}, max=${maxTotal}, avg=${avgTotal.toFixed(1)}, range=${rangeTotal}`)
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

testJulyWeekendFairness()
