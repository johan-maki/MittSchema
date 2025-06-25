const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Analyzing current Gurobi configuration and testing fairness parameters')

async function analyzeGurobiConfig() {
  try {
    // Test current schedule generation with different parameters
    console.log('\n📊 Testing current configuration...')
    
    const baseRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07", // One week for testing
      "min_nurses_per_shift": 2,
      "max_hours_per_nurse": 40
    }
    
    console.log('Base request:', JSON.stringify(baseRequest, null, 2))
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(baseRequest)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', response.status, errorText)
      return
    }
    
    const result = await response.json()
    console.log('\n📈 Current Results:')
    console.log('Total shifts:', result.schedule?.length || 0)
    console.log('Status:', result.optimization_status)
    
    if (result.schedule) {
      // Analyze weekend fairness
      console.log('\n🎯 Weekend Fairness Analysis:')
      const weekendShifts = result.schedule.filter(shift => shift.is_weekend)
      console.log('Total weekend shifts:', weekendShifts.length)
      
      // Group by employee
      const employeeWeekendCount = {}
      weekendShifts.forEach(shift => {
        const empId = shift.employee_id
        employeeWeekendCount[empId] = (employeeWeekendCount[empId] || 0) + 1
      })
      
      console.log('Weekend shifts per employee:')
      Object.entries(employeeWeekendCount).forEach(([empId, count]) => {
        const shift = result.schedule.find(s => s.employee_id === empId)
        const name = shift ? shift.employee_name : 'Unknown'
        console.log(`  ${name}: ${count} weekend shifts`)
      })
      
      // Analyze shift coverage (min 2 per shift requirement)
      console.log('\n🔍 Minimum Staff Coverage Analysis:')
      const shiftSlots = {}
      result.schedule.forEach(shift => {
        const key = `${shift.date}_${shift.shift_type}`
        if (!shiftSlots[key]) shiftSlots[key] = []
        shiftSlots[key].push(shift)
      })
      
      let violations = 0
      Object.entries(shiftSlots).forEach(([slot, shifts]) => {
        if (shifts.length < 2) {
          violations++
          console.log(`  ❌ ${slot}: Only ${shifts.length} staff (need 2)`)
        } else {
          console.log(`  ✅ ${slot}: ${shifts.length} staff`)
        }
      })
      
      console.log(`\nViolations: ${violations}/${Object.keys(shiftSlots).length} shifts`)
    }
    
    // Test with enhanced fairness parameters
    console.log('\n🧪 Testing enhanced fairness parameters...')
    
    const enhancedRequest = {
      ...baseRequest,
      "fairness_weight": 0.8,
      "weekend_fairness_penalty": 100,
      "enforce_min_staff": true,
      "balance_workload": true
    }
    
    console.log('Enhanced request:', JSON.stringify(enhancedRequest, null, 2))
    
    const enhancedResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancedRequest)
    })
    
    if (enhancedResponse.ok) {
      const enhancedResult = await enhancedResponse.json()
      console.log('\n✅ Enhanced configuration accepted!')
      console.log('Enhanced total shifts:', enhancedResult.schedule?.length || 0)
      
      if (enhancedResult.schedule) {
        // Quick analysis of enhanced results
        const enhancedWeekendShifts = enhancedResult.schedule.filter(s => s.is_weekend)
        const enhancedWeekendCount = {}
        enhancedWeekendShifts.forEach(shift => {
          const empId = shift.employee_id
          enhancedWeekendCount[empId] = (enhancedWeekendCount[empId] || 0) + 1
        })
        
        console.log('Enhanced weekend distribution:')
        Object.entries(enhancedWeekendCount).forEach(([empId, count]) => {
          const shift = enhancedResult.schedule.find(s => s.employee_id === empId)
          const name = shift ? shift.employee_name : 'Unknown'
          console.log(`  ${name}: ${count} weekend shifts`)
        })
      }
    } else {
      const errorText = await enhancedResponse.text()
      console.log('❌ Enhanced parameters not supported:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
  }
}

analyzeGurobiConfig()
