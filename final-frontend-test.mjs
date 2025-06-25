const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🚀 Final test: Frontend simulation with automatic weekend penalty')

async function finalFrontendTest() {
  try {
    // Simulera exakt vad frontend skulle skicka med den nya konfigurationen
    const frontendRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-31",
      "department": "Akutmottagning",
      "random_seed": Date.now() % 1000000,
      "optimizer": "gurobi",
      "min_staff_per_shift": 2, // Från frontend slider (nu default 2)
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "min_experience_per_shift": 1, // Från frontend slider
      "include_weekends": true, // Från frontend toggle
      "weekend_penalty_weight": Math.max(1000, 2 * 500), // Automatisk beräkning (1000)
      "fairness_weight": 1.0, // Maximal rättvisa
      "balance_workload": true,
      "max_hours_per_nurse": 40
    }
    
    console.log('\n📤 Frontend request (simulated):')
    console.log(JSON.stringify(frontendRequest, null, 2))
    
    const startTime = Date.now()
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendRequest)
    })
    
    const endTime = Date.now()
    console.log(`\n⏱️  Request completed in ${endTime - startTime}ms`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Request failed:', response.status, errorText)
      return
    }
    
    const result = await response.json()
    
    console.log('\n📊 Results:')
    console.log('Status:', result.optimization_status)
    console.log('Total assignments:', result.schedule?.length || 0)
    
    if (result.schedule) {
      // Staffing analysis
      const shiftCounts = {}
      result.schedule.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        shiftCounts[key] = (shiftCounts[key] || 0) + 1
      })
      
      const counts = Object.values(shiftCounts)
      const minStaff = Math.min(...counts)
      const maxStaff = Math.max(...counts)
      const uniqueShifts = Object.keys(shiftCounts).length
      
      console.log(`\n👥 Staffing Analysis:`)
      console.log(`   ${uniqueShifts} unique shifts`)
      console.log(`   ${minStaff}-${maxStaff} staff per shift`)
      console.log(`   Target: 2 staff per shift`)
      
      if (minStaff >= 2 && maxStaff <= 2) {
        console.log('   ✅ PERFECT: All shifts have exactly 2 staff')
      } else if (minStaff >= 2) {
        console.log('   ✅ GOOD: All shifts meet minimum 2 staff')
      } else {
        console.log('   ❌ PROBLEM: Some shifts below minimum 2 staff')
      }
      
      // Weekend fairness analysis
      const weekendShifts = result.schedule.filter(s => s.is_weekend)
      if (weekendShifts.length > 0) {
        const employeeWeekendCount = {}
        const employeeNames = {}
        
        weekendShifts.forEach(shift => {
          employeeWeekendCount[shift.employee_id] = (employeeWeekendCount[shift.employee_id] || 0) + 1
          employeeNames[shift.employee_id] = shift.employee_name
        })
        
        const weekendCounts = Object.values(employeeWeekendCount)
        const minWeekend = Math.min(...weekendCounts)
        const maxWeekend = Math.max(...weekendCounts)
        const difference = maxWeekend - minWeekend
        
        console.log(`\n🎯 Weekend Fairness Analysis:`)
        console.log(`   Range: ${minWeekend}-${maxWeekend} weekend shifts per person`)
        console.log(`   Difference: ${difference}`)
        
        if (difference <= 1) {
          console.log('   ✅ EXCELLENT fairness (≤1 difference)')
        } else if (difference <= 2) {
          console.log('   ✅ GOOD fairness (≤2 difference)')
        } else {
          console.log('   ⚠️  FAIR fairness (>2 difference)')
        }
        
        console.log('   Distribution:')
        Object.entries(employeeWeekendCount)
          .sort(([,a], [,b]) => a - b)
          .forEach(([empId, count]) => {
            console.log(`     ${employeeNames[empId]}: ${count} weekend shifts`)
          })
      }
      
      console.log('\n🎉 FINAL RESULTS:')
      if (minStaff >= 2 && difference <= 2) {
        console.log('✅ SOLUTION WORKS PERFECTLY!')
        console.log('✅ Frontend controls minimum staff per shift correctly')
        console.log('✅ Automatic weekend penalty provides good fairness')
        console.log('✅ No need for user to configure weekend penalty')
        console.log('✅ Peter (and everyone) will get fair weekend distribution')
      } else {
        console.log('⚠️  Solution needs adjustment')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

finalFrontendTest()
