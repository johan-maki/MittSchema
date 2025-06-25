const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing enhanced penalties for better weekend fairness')

async function testEnhancedPenalties() {
  try {
    // Test med olika penalty-konfigurationer
    const configurations = [
      {
        name: "Strong Staffing Constraints",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 50
        }
      },
      {
        name: "Very High Weekend Penalty",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 200
        }
      },
      {
        name: "Extreme Fairness Focus",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 500,
          "fairness_weight": 1.0,
          "balance_workload": true
        }
      }
    ]

    for (const test of configurations) {
      console.log(`\n📋 Testing: ${test.name}`)
      console.log('Configuration:', JSON.stringify(test.config, null, 2))
      
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
      console.log('Total shifts:', result.schedule?.length || 0)
      
      if (result.schedule) {
        // Analyze staffing
        console.log('\n👥 Staffing Analysis:')
        const staffingViolations = []
        const shiftStaffing = {}
        
        result.schedule.forEach(shift => {
          const key = `${shift.date}_${shift.shift_type}`
          if (!shiftStaffing[key]) {
            shiftStaffing[key] = 0
          }
          shiftStaffing[key]++
        })
        
        Object.entries(shiftStaffing).forEach(([shiftKey, count]) => {
          if (count < 2) {
            staffingViolations.push(`${shiftKey}: ${count} staff`)
          }
        })
        
        if (staffingViolations.length === 0) {
          console.log('✅ All shifts have minimum 2 staff!')
        } else {
          console.log('❌ Staffing violations:', staffingViolations.length)
          console.log('First few violations:', staffingViolations.slice(0, 5))
        }
        
        // Analyze weekend fairness
        console.log('\n🎯 Weekend Fairness:')
        const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
        const employeeWeekendCount = {}
        
        weekendShifts.forEach(shift => {
          const empId = shift.employee_id
          employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
        })
        
        console.log('Weekend shifts per employee:')
        const counts = Object.values(employeeWeekendCount)
        const minCount = Math.min(...counts)
        const maxCount = Math.max(...counts)
        console.log(`Range: ${minCount} - ${maxCount} weekend shifts`)
        
        Object.entries(employeeWeekendCount).forEach(([empId, count]) => {
          console.log(`  Employee ${empId}: ${count} weekend shifts`)
        })
        
        console.log('---')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testEnhancedPenalties()
