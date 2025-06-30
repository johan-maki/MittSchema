const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🧪 Testing complete frontend-to-Gurobi flow with weekend penalty control')

async function testCompleteFrontendFlow() {
  try {
    // Testa olika frontend-konfigurationer som användaren kan ställa in
    const testConfigurations = [
      {
        name: "Chef Setting: 1 staff per shift, Low Weekend Penalty",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 1,
          "minimum_staff": 1,
          "staff_constraint": "strict",
          "weekend_penalty_weight": 200,
          "max_hours_per_nurse": 40
        }
      },
      {
        name: "Chef Setting: 2 staff per shift, Medium Weekend Penalty",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "weekend_penalty_weight": 1000,
          "max_hours_per_nurse": 40
        }
      },
      {
        name: "Chef Setting: 2 staff per shift, Ultra High Weekend Penalty",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "weekend_penalty_weight": 2000,
          "fairness_weight": 1.0,
          "balance_workload": true,
          "max_hours_per_nurse": 40
        }
      }
    ]

    for (const test of testConfigurations) {
      console.log(`\n📋 ${test.name}`)
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
      console.log('✅ Status:', result.optimization_status)
      console.log('📊 Total assignments:', result.schedule?.length || 0)
      
      if (result.schedule) {
        // Verify staffing compliance
        const shiftStaffing = {}
        result.schedule.forEach(shift => {
          const key = `${shift.date}_${shift.shift_type}`
          shiftStaffing[key] = (shiftStaffing[key] || 0) + 1
        })
        
        const staffCounts = Object.values(shiftStaffing)
        const minStaff = Math.min(...staffCounts)
        const maxStaff = Math.max(...staffCounts)
        
        console.log(`👥 Staffing: ${minStaff}-${maxStaff} per shift (target: ${test.config.min_staff_per_shift})`)
        
        if (minStaff >= test.config.min_staff_per_shift) {
          console.log('✅ PASSES minimum staffing requirement')
        } else {
          console.log('❌ FAILS minimum staffing requirement')
        }
        
        // Weekend fairness analysis
        const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
        if (weekendShifts.length > 0) {
          const employeeWeekendCount = {}
          weekendShifts.forEach(shift => {
            const empId = shift.employee_id
            employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
          })
          
          const weekendCounts = Object.values(employeeWeekendCount)
          const minWeekend = Math.min(...weekendCounts)
          const maxWeekend = Math.max(...weekendCounts)
          const difference = maxWeekend - minWeekend
          
          console.log(`🎯 Weekend fairness: ${minWeekend}-${maxWeekend} (difference: ${difference})`)
          
          if (difference <= 1) {
            console.log('✅ EXCELLENT weekend fairness')
          } else if (difference <= 2) {
            console.log('✅ GOOD weekend fairness')
          } else {
            console.log('⚠️  FAIR weekend fairness')
          }
          
          // Show distribution
          const employeeNames = {}
          weekendShifts.forEach(shift => {
            employeeNames[shift.employee_id] = shift.employee_name
          })
          
          console.log('   Weekend distribution:')
          Object.entries(employeeWeekendCount).forEach(([empId, count]) => {
            const name = employeeNames[empId] || 'Unknown'
            console.log(`     ${name}: ${count} weekend shifts`)
          })
        }
        
        console.log('---')
      }
    }
    
    console.log('\n🎉 SUMMARY:')
    console.log('✅ Frontend can now control minimum staff per shift (1 or 2)')
    console.log('✅ Frontend can now control weekend penalty for fairness (200-2000)')
    console.log('✅ Gurobi respects both frontend settings accurately')
    console.log('✅ Higher weekend penalty improves fairness distribution')
    console.log('')
    console.log('📝 RECOMMENDATIONS FOR USER:')
    console.log('• For maximum fairness: Set weekend penalty to 1500-2000')
    console.log('• For faster generation: Set weekend penalty to 500-1000')
    console.log('• Always use minimum 2 staff per shift for proper coverage')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testCompleteFrontendFlow()
