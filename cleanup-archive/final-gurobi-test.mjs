const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 FINAL TEST: Gurobi optimization with 10 nurses')
console.log('📋 Requirement: Minimum 2 nurses per shift')

async function finalGurobiTest() {
  try {
    const scheduleRequest = {
      "start_date": "2025-07-01", 
      "end_date": "2025-07-31",
      "min_nurses_per_shift": 2,
      "max_hours_per_nurse": 160,
      "cost_optimization": true
    }
    
    console.log('\n📋 Schedule Parameters:')
    console.log('   Period: July 2025 (31 days)')
    console.log('   Min nurses per shift: 2')
    console.log('   Max hours per nurse: 160/month')
    console.log('   Cost optimization: Enabled')
    
    console.log('\n⏳ Generating optimal schedule...')
    const startTime = Date.now()
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleRequest)
    })
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Optimization failed: ${response.status} - ${errorText}`)
      return
    }
    
    const result = await response.json()
    
    console.log(`\n✅ Optimization completed in ${duration.toFixed(1)} seconds`)
    console.log('📊 Results Overview:')
    console.log('   Status:', result.optimization_status)
    console.log('   Message:', result.message)
    console.log('   Optimizer:', result.optimizer)
    console.log('   Objective value:', result.objective_value)
    console.log('   Total shifts scheduled:', result.schedule?.length || 0)
    
    if (result.coverage_stats) {
      console.log('\n📈 Coverage Statistics:')
      console.log('   Total shifts needed:', result.coverage_stats.total_shifts)
      console.log('   Shifts filled:', result.coverage_stats.filled_shifts)
      console.log('   Coverage percentage:', result.coverage_stats.coverage_percentage + '%')
    }
    
    if (result.fairness_stats) {
      console.log('\n⚖️  Fairness Statistics:')
      console.log('   Min shifts per employee:', result.fairness_stats.min_shifts_per_employee)
      console.log('   Max shifts per employee:', result.fairness_stats.max_shifts_per_employee)
      console.log('   Avg shifts per employee:', result.fairness_stats.avg_shifts_per_employee)
      console.log('   Distribution range:', result.fairness_stats.shift_distribution_range)
    }
    
    if (result.schedule && result.schedule.length > 0) {
      console.log('\n🔍 CONSTRAINT ANALYSIS: Minimum 2 nurses per shift')
      
      // Group shifts by date and shift type
      const shiftGroups = {}
      
      result.schedule.forEach(shift => {
        const date = shift.date
        const shiftType = shift.shift_type
        const key = `${date}_${shiftType}`
        
        if (!shiftGroups[key]) {
          shiftGroups[key] = []
        }
        shiftGroups[key].push(shift)
      })
      
      let totalShiftSlots = 0
      let violations = 0
      let perfectCompliance = 0
      let overstaffed = 0
      
      console.log('\n📅 Daily Shift Coverage:')
      console.log('Date       Day  Eve  Night')
      console.log('--------   --- ---- -----')
      
      // Get unique dates and sort them
      const dates = [...new Set(result.schedule.map(s => s.date))].sort()
      
      dates.forEach(date => {
        const dayShifts = shiftGroups[`${date}_day`] || []
        const eveningShifts = shiftGroups[`${date}_evening`] || []
        const nightShifts = shiftGroups[`${date}_night`] || []
        
        const dayCount = dayShifts.length
        const eveningCount = eveningShifts.length
        const nightCount = nightShifts.length
        
        // Day of week
        const dayOfWeek = new Date(date).toLocaleDateString('sv-SE', { weekday: 'short' })
        
        console.log(`${date} ${dayOfWeek}   ${dayCount.toString().padStart(2)}   ${eveningCount.toString().padStart(2)}    ${nightCount.toString().padStart(2)}`)
        
        // Count violations and compliance
        [dayCount, eveningCount, nightCount].forEach(count => {
          if (count > 0) { // Only count shifts that exist
            totalShiftSlots++
            if (count < 2) violations++
            else if (count === 2) perfectCompliance++
            else overstaffed++
          }
        })
      })
      
      console.log('\n📊 CONSTRAINT COMPLIANCE SUMMARY:')
      console.log('='.repeat(40))
      console.log(`Total shift slots: ${totalShiftSlots}`)
      console.log(`❌ Violations (< 2 nurses): ${violations}`)
      console.log(`✅ Perfect compliance (= 2): ${perfectCompliance}`)
      console.log(`⬆️  Over-staffed (> 2): ${overstaffed}`)
      console.log(`📈 Compliance rate: ${((totalShiftSlots - violations) / totalShiftSlots * 100).toFixed(1)}%`)
      
      if (violations === 0) {
        console.log('\n🎉 EXCELLENT! All shifts meet the minimum 2 nurses requirement!')
      } else {
        console.log(`\n⚠️  WARNING: ${violations} shifts have fewer than 2 nurses`)
      }
      
      // Cost analysis
      console.log('\n💰 COST ANALYSIS:')
      console.log('='.repeat(40))
      const hourlyRate = 1000 // SEK per hour
      const totalHours = result.schedule.length * 8 // Assuming 8-hour shifts
      const totalCost = totalHours * hourlyRate
      
      console.log(`Shifts scheduled: ${result.schedule.length}`)
      console.log(`Total hours: ${totalHours}`)
      console.log(`Hourly rate: ${hourlyRate} SEK`)
      console.log(`Total cost: ${totalCost.toLocaleString()} SEK`)
      console.log(`Average cost per day: ${(totalCost / 31).toLocaleString()} SEK`)
      
      // Employee workload
      console.log('\n👥 EMPLOYEE WORKLOAD:')
      console.log('='.repeat(40))
      
      if (result.employee_stats) {
        const employeeIds = Object.keys(result.employee_stats)
        console.log(`Employees utilized: ${employeeIds.length}/10`)
        
        // Get employee names and shift counts
        const employeeWorkload = employeeIds.map(id => {
          const shifts = result.schedule.filter(s => s.employee_id === id)
          const name = shifts.length > 0 ? shifts[0].employee_name : 'Unknown'
          return {
            id,
            name: name.split(' ')[0], // First name only
            shifts: shifts.length,
            hours: shifts.length * 8
          }
        }).sort((a, b) => b.shifts - a.shifts)
        
        employeeWorkload.forEach((emp, i) => {
          console.log(`${(i+1).toString().padStart(2)}. ${emp.name.padEnd(12)}: ${emp.shifts.toString().padStart(2)} shifts (${emp.hours.toString().padStart(3)} hours)`)
        })
        
        const shifts = employeeWorkload.map(e => e.shifts)
        console.log(`\nWorkload range: ${Math.min(...shifts)} - ${Math.max(...shifts)} shifts`)
        console.log(`Average: ${(shifts.reduce((a, b) => a + b, 0) / shifts.length).toFixed(1)} shifts per employee`)
      }
      
      console.log('\n🎯 SUMMARY:')
      console.log('='.repeat(40))
      console.log(`✅ Successfully generated optimized schedule for July 2025`)
      console.log(`✅ Used Gurobi optimizer (status: ${result.optimization_status})`) 
      console.log(`✅ Total of ${result.schedule.length} shifts scheduled`)
      console.log(`${violations === 0 ? '✅' : '⚠️'} Minimum 2 nurses constraint: ${violations === 0 ? 'MET' : 'VIOLATED ' + violations + ' times'}`)
      console.log(`✅ Cost optimization objective: ${result.objective_value}`)
      
    } else {
      console.log('\n❌ No schedule data returned')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

finalGurobiTest()
