const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing different approaches to enforce minimum 2 staff and weekend fairness')

async function testEnforcementStrategies() {
  try {
    const strategies = [
      {
        name: "Strategy 1: Direct enforcement",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_nurses_per_shift": 2,
          "max_hours_per_nurse": 40,
          "enforce_minimum_staffing": true
        }
      },
      {
        name: "Strategy 2: Higher penalty approach",
        params: {
          "start_date": "2025-07-01", 
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "min_nurses_per_shift": 2,
          "staffing_violation_penalty": 1000,
          "max_hours_per_nurse": 40
        }
      },
      {
        name: "Strategy 3: Alternative parameter names",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07", 
          "minimum_staff": 2,
          "required_nurses": 2,
          "max_hours_per_nurse": 40
        }
      },
      {
        name: "Strategy 4: Constraint-based",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "constraints": {
            "min_nurses_per_shift": 2,
            "max_hours_per_nurse": 40,
            "enforce_minimum": true
          }
        }
      },
      {
        name: "Strategy 5: Weekend fairness focus",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_nurses_per_shift": 2,
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 50,
          "fairness_objective": true,
          "balance_weekend_shifts": true
        }
      }
    ]
    
    for (const strategy of strategies) {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`🧪 ${strategy.name}`)
      console.log(`${'='.repeat(50)}`)
      console.log('Parameters:', JSON.stringify(strategy.params, null, 2))
      
      try {
        const response = await fetch(`${API_URL}/optimize-schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(strategy.params)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.log(`❌ Failed: ${response.status} - ${errorText}`)
          continue
        }
        
        const result = await response.json()
        console.log(`✅ Success: ${result.schedule?.length || 0} shifts generated`)
        console.log(`Status: ${result.optimization_status}`)
        
        if (result.schedule && result.schedule.length > 0) {
          // Check minimum staffing compliance
          const shiftSlots = {}
          result.schedule.forEach(shift => {
            const key = `${shift.date}_${shift.shift_type}`
            if (!shiftSlots[key]) shiftSlots[key] = []
            shiftSlots[key].push(shift)
          })
          
          const violations = Object.values(shiftSlots).filter(shifts => shifts.length < 2).length
          const totalSlots = Object.keys(shiftSlots).length
          const compliance = ((totalSlots - violations) / totalSlots * 100).toFixed(1)
          
          console.log(`📊 Staffing compliance: ${compliance}% (${violations}/${totalSlots} violations)`)
          
          // Check weekend distribution
          const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
          const employeeWeekendCount = {}
          weekendShifts.forEach(shift => {
            const empName = shift.employee_name || shift.employee_id
            employeeWeekendCount[empName] = (employeeWeekendCount[empName] || 0) + 1
          })
          
          console.log('Weekend distribution:')
          const weekendCounts = Object.values(employeeWeekendCount)
          const minWeekend = Math.min(...weekendCounts)
          const maxWeekend = Math.max(...weekendCounts)
          const weekendRange = maxWeekend - minWeekend
          
          Object.entries(employeeWeekendCount).forEach(([name, count]) => {
            console.log(`  ${name.split(' ')[0]}: ${count} weekend shifts`)
          })
          console.log(`Weekend fairness range: ${minWeekend}-${maxWeekend} (difference: ${weekendRange})`)
          
          // Rate this strategy
          const staffingScore = parseInt(compliance)
          const fairnessScore = Math.max(0, 100 - (weekendRange * 20))
          const overallScore = (staffingScore + fairnessScore) / 2
          
          console.log(`🎯 Strategy Score: ${overallScore.toFixed(1)}/100`)
          console.log(`   Staffing: ${staffingScore}/100`)
          console.log(`   Fairness: ${fairnessScore}/100`)
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`\n${'='.repeat(50)}`)
    console.log('🏁 SUMMARY')
    console.log(`${'='.repeat(50)}`)
    console.log('Next steps based on results:')
    console.log('1. If no strategy achieves 100% staffing compliance,')
    console.log('   we need to investigate the backend algorithm')
    console.log('2. The best-scoring strategy should be used for production')
    console.log('3. Weekend fairness may need backend algorithm changes')
    
  } catch (error) {
    console.error('❌ Testing failed:', error)
  }
}

testEnforcementStrategies()
