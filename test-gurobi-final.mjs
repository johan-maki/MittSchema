const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing Gurobi optimization with correct parameters')
console.log('✅ Found working endpoint: /optimize-schedule')

async function testGurobiOptimizationCorrect() {
  try {
    // Create correct data format with start_date and end_date
    const scheduleData = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-31",
      "min_nurses_per_shift": 2,
      "max_hours_per_nurse": 160,
      "cost_optimization": true
    }
    
    console.log('\n📋 Schedule request:')
    console.log(JSON.stringify(scheduleData, null, 2))
    
    console.log('\n⏳ Generating optimized schedule for July 2025...')
    console.log('🎯 Key constraint: Minimum 2 nurses per shift')
    
    const startTime = Date.now()
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData)
    })
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    console.log(`\n📊 Response received in ${duration.toFixed(1)} seconds`)
    console.log(`   Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Optimization failed:')
      console.error('   Status:', response.status)
      console.error('   Error:', errorText)
      return
    }
    
    const result = await response.json()
    console.log('\n✅ Optimization completed successfully!')
    
    console.log('\n📊 Results Summary:')
    console.log('   Status:', result.status || 'Not provided')
    console.log('   Total shifts:', result.shifts?.length || 0)
    console.log('   Total cost:', result.total_cost || 'Not provided')
    console.log('   Optimization time:', result.solve_time || 'Not provided')
    console.log('   Objective value:', result.objective_value || 'Not provided')
    
    if (result.shifts && result.shifts.length > 0) {
      console.log('\n🔍 Analyzing constraint compliance...')
      
      // Group shifts by date and shift type
      const shiftGroups = {}
      
      result.shifts.forEach(shift => {
        const date = shift.date || shift.start_date?.split('T')[0] || shift.start_time?.split('T')[0]
        const shiftType = shift.shift_type || shift.type || 'unknown'
        const key = `${date}_${shiftType}`
        
        if (!shiftGroups[key]) {
          shiftGroups[key] = []
        }
        shiftGroups[key].push(shift)
      })
      
      console.log('\n📋 Shift Coverage Analysis:')
      let totalShiftSlots = 0
      let violationsCount = 0
      let perfectComplianceCount = 0
      
      Object.keys(shiftGroups).sort().forEach(key => {
        const shifts = shiftGroups[key]
        const [date, type] = key.split('_')
        const nurseCount = shifts.length
        
        totalShiftSlots++
        
        let status = '✅'
        if (nurseCount < 2) {
          status = '❌'
          violationsCount++
        } else if (nurseCount === 2) {
          perfectComplianceCount++
        }
        
        console.log(`   ${date} ${type.padEnd(8)}: ${nurseCount} nurses ${status}`)
      })
      
      console.log('\n📈 Compliance Statistics:')
      console.log(`   Total shift slots: ${totalShiftSlots}`)
      console.log(`   Violations (< 2 nurses): ${violationsCount}`)
      console.log(`   Perfect compliance (exactly 2): ${perfectComplianceCount}`)
      console.log(`   Over-staffed (> 2): ${totalShiftSlots - violationsCount - perfectComplianceCount}`)
      console.log(`   Compliance rate: ${((totalShiftSlots - violationsCount) / totalShiftSlots * 100).toFixed(1)}%`)
      
      if (violationsCount === 0) {
        console.log('   🎉 PERFECT! All shifts meet the minimum 2 nurses requirement!')
      } else {
        console.log(`   ⚠️  ${violationsCount} shifts do not meet the minimum requirement`)
      }
      
      // Cost analysis
      console.log('\n💰 Cost Analysis:')
      const hourlyRate = 1000 // SEK per hour as we set
      let totalCost = 0
      let totalHours = 0
      
      result.shifts.forEach(shift => {
        const hours = shift.hours || shift.duration || 8 // Default 8-hour shifts
        const cost = shift.cost || (hours * hourlyRate)
        totalCost += cost
        totalHours += hours
      })
      
      console.log(`   Total hours scheduled: ${totalHours}`)
      console.log(`   Total cost: ${totalCost} SEK`)
      console.log(`   Average cost per shift: ${(totalCost / result.shifts.length).toFixed(0)} SEK`)
      console.log(`   Cost per hour: ${(totalCost / totalHours).toFixed(0)} SEK`)
      
      // Employee workload
      console.log('\n👥 Employee Workload Distribution:')
      const employeeHours = {}
      
      result.shifts.forEach(shift => {
        const empId = shift.employee_id || shift.nurse_id || shift.assigned_to
        if (empId) {
          const hours = shift.hours || shift.duration || 8
          employeeHours[empId] = (employeeHours[empId] || 0) + hours
        }
      })
      
      const workloads = Object.values(employeeHours).sort((a, b) => a - b)
      console.log(`   Employees assigned: ${Object.keys(employeeHours).length}`)
      console.log(`   Hours range: ${Math.min(...workloads)} - ${Math.max(...workloads)} hours`)
      console.log(`   Average hours per employee: ${(workloads.reduce((a, b) => a + b, 0) / workloads.length).toFixed(1)}`)
      
      // Show first few shifts as examples
      console.log('\n📋 Sample shifts:')
      result.shifts.slice(0, 5).forEach((shift, i) => {
        const date = shift.date || shift.start_date?.split('T')[0] || shift.start_time?.split('T')[0]
        const type = shift.shift_type || shift.type
        const empId = (shift.employee_id || shift.nurse_id || 'Unknown').toString().slice(-8)
        console.log(`   ${i+1}. ${date} ${type} - Employee ...${empId}`)
      })
      
      if (result.shifts.length > 5) {
        console.log(`   ... and ${result.shifts.length - 5} more shifts`)
      }
      
    } else {
      console.log('\n⚠️  No shifts returned in optimization result')
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testGurobiOptimizationCorrect()
