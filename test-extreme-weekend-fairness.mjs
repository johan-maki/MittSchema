const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing extreme penalties for maximum weekend fairness')

async function testExtremeWeekendFairness() {
  try {
    const configurations = [
      {
        name: "Ultra High Weekend Penalty",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-31",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 1000, // Extremt hög penalty
          "fairness_weight": 1.0,
          "balance_workload": true
        }
      },
      {
        name: "Maximum Fairness Focus",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-31",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 2000, // Än högre penalty
          "fairness_weight": 1.0,
          "balance_workload": true,
          "weekend_fairness_penalty": 1000 // Extra parameter
        }
      }
    ]

    for (const test of configurations) {
      console.log(`\n📋 Testing: ${test.name}`)
      console.log('Key parameters:', {
        weekend_penalty_weight: test.config.weekend_penalty_weight,
        fairness_weight: test.config.fairness_weight,
        weekend_fairness_penalty: test.config.weekend_fairness_penalty
      })
      
      const response = await fetch(`${API_URL}/optimize-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.config)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        continue
      }
      
      const result = await response.json()
      console.log('Status:', result.optimization_status)
      console.log('Total assignments:', result.schedule?.length || 0)
      
      if (result.schedule) {
        // Weekend fairness analysis
        const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
        const employeeWeekendCount = {}
        const employeeNames = {}
        
        weekendShifts.forEach(shift => {
          const empId = shift.employee_id
          employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
          employeeNames[empId] = shift.employee_name
        })
        
        const weekendCounts = Object.values(employeeWeekendCount)
        if (weekendCounts.length > 0) {
          const minWeekend = Math.min(...weekendCounts)
          const maxWeekend = Math.max(...weekendCounts)
          const difference = maxWeekend - minWeekend
          
          console.log(`🎯 Weekend Distribution:`)
          console.log(`   Range: ${minWeekend} - ${maxWeekend} (difference: ${difference})`)
          
          // Sortera efter antal helgpass
          const sortedEmployees = Object.entries(employeeWeekendCount)
            .map(([empId, count]) => ({ name: employeeNames[empId], count }))
            .sort((a, b) => a.count - b.count)
          
          sortedEmployees.forEach(emp => {
            console.log(`   ${emp.name}: ${emp.count} weekend shifts`)
          })
          
          if (difference <= 1) {
            console.log('   ✅ EXCELLENT fairness (max difference: ≤1)')
          } else if (difference <= 2) {
            console.log('   ✅ GOOD fairness (max difference: ≤2)')
          } else if (difference <= 3) {
            console.log('   ⚠️  FAIR fairness (max difference: ≤3)')
          } else {
            console.log('   ❌ POOR fairness (max difference: >3)')
          }
        }
        
        console.log('---')
      }
    }
    
    // Test med enbart en vecka för att se om det ger bättre resultat
    console.log(`\n📋 Testing: One Week Only (Better Granularity)`)
    const weekTest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "max_hours_per_nurse": 40,
      "weekend_penalty_weight": 1000,
      "fairness_weight": 1.0,
      "balance_workload": true
    }
    
    const weekResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weekTest)
    })
    
    if (weekResponse.ok) {
      const weekResult = await weekResponse.json()
      console.log('Week Status:', weekResult.optimization_status)
      
      if (weekResult.schedule) {
        const weekendShifts = weekResult.schedule.filter(shift => shift.is_weekend)
        const employeeWeekendCount = {}
        const employeeNames = {}
        
        weekendShifts.forEach(shift => {
          const empId = shift.employee_id
          employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
          employeeNames[empId] = shift.employee_name
        })
        
        console.log('🎯 One Week Weekend Distribution:')
        Object.entries(employeeWeekendCount).forEach(([empId, count]) => {
          console.log(`   ${employeeNames[empId]}: ${count} weekend shifts`)
        })
        
        const weekendCounts = Object.values(employeeWeekendCount)
        if (weekendCounts.length > 0) {
          const minWeekend = Math.min(...weekendCounts)
          const maxWeekend = Math.max(...weekendCounts)
          console.log(`   Range: ${minWeekend} - ${maxWeekend} (difference: ${maxWeekend - minWeekend})`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testExtremeWeekendFairness()
