const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing Gurobi optimization with 10 nurses and minimum 2 per shift')
console.log('🔗 Using API:', API_URL)

async function testGurobiWith10Nurses() {
  try {
    console.log('\n📊 Step 1: Verifying we have 10 nurses available...')
    
    // Get current employees for Gurobi
    const employeesResponse = await fetch(`${API_URL}/employees`)
    if (!employeesResponse.ok) {
      throw new Error(`Failed to fetch employees: ${employeesResponse.status}`)
    }
    
    const employees = await employeesResponse.json()
    console.log(`✅ Found ${employees.length} employees available for scheduling`)
    
    if (employees.length < 10) {
      console.log('⚠️  Warning: Less than 10 employees found')
    }
    
    employees.forEach((emp, i) => {
      console.log(`   ${i+1}. ${emp.name} (Cost: ${emp.hourly_cost || emp.cost || 'No cost'} SEK/timme)`)
    })
    
    console.log('\n🎯 Step 2: Testing schedule generation with minimum 2 nurses per shift...')
    
    // Test schedule generation for a week in July
    const scheduleRequest = {
      year: 2025,
      month: 7, // July
      min_nurses_per_shift: 2, // Key requirement: minimum 2 nurses per shift
      max_hours_per_nurse: 160, // Monthly limit
      shift_types: ['day', 'evening', 'night']
    }
    
    console.log('📋 Schedule request parameters:')
    console.log('   Year:', scheduleRequest.year)
    console.log('   Month:', scheduleRequest.month)
    console.log('   Minimum nurses per shift:', scheduleRequest.min_nurses_per_shift)
    console.log('   Max hours per nurse:', scheduleRequest.max_hours_per_nurse)
    console.log('   Shift types:', scheduleRequest.shift_types.join(', '))
    
    console.log('\n⏳ Generating optimized schedule...')
    const startTime = Date.now()
    
    const scheduleResponse = await fetch(`${API_URL}/generate-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleRequest)
    })
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    if (!scheduleResponse.ok) {
      const errorText = await scheduleResponse.text()
      throw new Error(`Schedule generation failed: ${scheduleResponse.status} - ${errorText}`)
    }
    
    const scheduleResult = await scheduleResponse.json()
    console.log(`✅ Schedule generated successfully in ${duration.toFixed(1)} seconds`)
    
    console.log('\n📊 Schedule Analysis:')
    console.log('   Status:', scheduleResult.status)
    console.log('   Total shifts:', scheduleResult.shifts?.length || 0)
    console.log('   Total cost:', scheduleResult.total_cost || 'Not provided')
    console.log('   Objective value:', scheduleResult.objective_value || 'Not provided')
    
    if (scheduleResult.shifts && scheduleResult.shifts.length > 0) {
      // Group shifts by date and type to verify minimum 2 nurses constraint
      const shiftsByDate = {}
      
      scheduleResult.shifts.forEach(shift => {
        const date = shift.date || shift.start_time?.split('T')[0]
        const shiftType = shift.shift_type || shift.type
        const key = `${date}_${shiftType}`
        
        if (!shiftsByDate[key]) {
          shiftsByDate[key] = []
        }
        shiftsByDate[key].push(shift)
      })
      
      console.log('\n🔍 Verifying minimum 2 nurses per shift constraint:')
      let violationCount = 0
      let totalShiftSlots = 0
      
      Object.keys(shiftsByDate).forEach(key => {
        const shifts = shiftsByDate[key]
        const [date, type] = key.split('_')
        const nurseCount = shifts.length
        
        totalShiftSlots++
        console.log(`   ${date} ${type}: ${nurseCount} nurses`)
        
        if (nurseCount < 2) {
          violationCount++
          console.log(`     ❌ VIOLATION: Less than 2 nurses assigned!`)
        }
      })
      
      console.log('\n📈 Constraint Verification Summary:')
      console.log(`   Total shift slots: ${totalShiftSlots}`)
      console.log(`   Violations (< 2 nurses): ${violationCount}`)
      console.log(`   Compliance rate: ${((totalShiftSlots - violationCount) / totalShiftSlots * 100).toFixed(1)}%`)
      
      if (violationCount === 0) {
        console.log('   ✅ ALL SHIFTS MEET MINIMUM 2 NURSES REQUIREMENT!')
      } else {
        console.log('   ❌ Some shifts do not meet the minimum requirement')
      }
      
      // Show cost distribution
      console.log('\n💰 Cost Analysis:')
      const totalHoursCost = scheduleResult.shifts.reduce((sum, shift) => {
        return sum + (shift.hours || 8) * (shift.hourly_cost || 1000)
      }, 0)
      console.log(`   Calculated total cost: ${totalHoursCost} SEK`)
      console.log(`   Average cost per shift: ${(totalHoursCost / scheduleResult.shifts.length).toFixed(0)} SEK`)
      
      // Employee workload distribution
      const employeeHours = {}
      scheduleResult.shifts.forEach(shift => {
        const empId = shift.employee_id || shift.nurse_id
        if (empId) {
          employeeHours[empId] = (employeeHours[empId] || 0) + (shift.hours || 8)
        }
      })
      
      console.log('\n👥 Employee Workload Distribution:')
      Object.keys(employeeHours).forEach(empId => {
        const hours = employeeHours[empId]
        const employee = employees.find(e => e.id === empId)
        const name = employee ? employee.name : `Employee ${empId}`
        console.log(`   ${name}: ${hours} hours`)
      })
      
    } else {
      console.log('   ⚠️  No shifts in result')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testGurobiWith10Nurses()
