const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Inspecting what frontend actually sends vs what works')

async function inspectFrontendRequest() {
  try {
    // Test 1: Exakt vad vårt working script skickar
    console.log('\n1️⃣ Test: Known working parameters')
    const workingParams = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict"
    }
    
    console.log('Working params:', JSON.stringify(workingParams, null, 2))
    
    const workingResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workingParams)
    })
    
    if (workingResponse.ok) {
      const workingResult = await workingResponse.json()
      console.log(`✅ Working result: ${workingResult.schedule?.length || 0} assignments`)
      
      const workingShiftCounts = {}
      workingResult.schedule?.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        workingShiftCounts[key] = (workingShiftCounts[key] || 0) + 1
      })
      
      const workingCounts = Object.values(workingShiftCounts)
      const workingMin = Math.min(...workingCounts)
      const workingMax = Math.max(...workingCounts)
      console.log(`Working staffing: ${workingMin}-${workingMax} per shift`)
    }
    
    // Test 2: Simulera exakt vad frontend skickar
    console.log('\n2️⃣ Test: Frontend simulation with ALL parameters')
    const frontendParams = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-31", // Längre period som frontend använder
      "department": "Akutmottagning",
      "random_seed": 123456,
      "optimizer": "gurobi",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "min_experience_per_shift": 1,
      "include_weekends": true,
      "weekend_penalty_weight": 1500,
      "fairness_weight": 1.0,
      "balance_workload": true,
      "max_hours_per_nurse": 40
    }
    
    console.log('Frontend params:', JSON.stringify(frontendParams, null, 2))
    
    const frontendResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(frontendParams)
    })
    
    if (frontendResponse.ok) {
      const frontendResult = await frontendResponse.json()
      console.log(`✅ Frontend result: ${frontendResult.schedule?.length || 0} assignments`)
      
      const frontendShiftCounts = {}
      frontendResult.schedule?.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        frontendShiftCounts[key] = (frontendShiftCounts[key] || 0) + 1
      })
      
      const frontendCounts = Object.values(frontendShiftCounts)
      const frontendMin = Math.min(...frontendCounts)
      const frontendMax = Math.max(...frontendCounts)
      const uniqueShifts = Object.keys(frontendShiftCounts).length
      
      console.log(`Frontend staffing: ${frontendMin}-${frontendMax} per shift (${uniqueShifts} shifts total)`)
      
      if (frontendMin >= 2) {
        console.log('✅ Frontend simulation works correctly!')
      } else {
        console.log('❌ Frontend simulation fails - this is the bug!')
        
        // Show some examples of understaffed shifts
        console.log('\nUnderstaffed shifts:')
        Object.entries(frontendShiftCounts)
          .filter(([shift, count]) => count < 2)
          .slice(0, 5)
          .forEach(([shift, count]) => {
            console.log(`  ${shift}: ${count} staff`)
          })
      }
    } else {
      console.log('❌ Frontend simulation failed:', frontendResponse.status)
    }
    
    // Test 3: Check if it's a month-length issue
    console.log('\n3️⃣ Test: One week vs one month')
    const weekParams = { ...frontendParams, "end_date": "2025-07-07" }
    
    const weekResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weekParams)
    })
    
    if (weekResponse.ok) {
      const weekResult = await weekResponse.json()
      const weekShiftCounts = {}
      weekResult.schedule?.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        weekShiftCounts[key] = (weekShiftCounts[key] || 0) + 1
      })
      
      const weekCounts = Object.values(weekShiftCounts)
      const weekMin = Math.min(...weekCounts)
      const weekMax = Math.max(...weekCounts)
      
      console.log(`Week simulation: ${weekMin}-${weekMax} per shift`)
      console.log(`Total assignments: ${weekResult.schedule?.length || 0}`)
      
      if (weekMin >= 2) {
        console.log('✅ Week works, month might be the problem!')
      }
    }
    
  } catch (error) {
    console.error('❌ Inspection failed:', error)
  }
}

inspectFrontendRequest()
