const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🚀 Waking up Gurobi backend and testing connection')

async function wakeUpAndTest() {
  try {
    console.log('\n1️⃣ Waking up backend...')
    
    // Wake up the backend with multiple requests
    const wakeUpPromises = []
    for (let i = 0; i < 3; i++) {
      wakeUpPromises.push(
        fetch(`${API_URL}/health`, { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        }).then(r => r.json()).catch(e => ({ error: e.message }))
      )
    }
    
    const wakeUpResults = await Promise.all(wakeUpPromises)
    console.log('Wake up results:', wakeUpResults)
    
    // Wait a bit for backend to fully start
    console.log('\n2️⃣ Waiting for backend to be fully ready...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Test optimization endpoint
    console.log('\n3️⃣ Testing optimization endpoint...')
    
    const testRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "max_hours_per_nurse": 40,
      "weekend_penalty_weight": 1000
    }
    
    console.log('Sending test request...')
    const startTime = Date.now()
    
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testRequest)
    })
    
    const endTime = Date.now()
    console.log(`Request completed in ${endTime - startTime}ms`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Optimization failed:', response.status, errorText)
      return
    }
    
    const result = await response.json()
    console.log('✅ Optimization succeeded!')
    console.log('Status:', result.optimization_status)
    console.log('Schedule length:', result.schedule?.length || 0)
    
    if (result.schedule?.length > 0) {
      console.log('✅ Backend is now fully awake and working!')
      
      // Quick fairness check
      const weekendShifts = result.schedule.filter(s => s.is_weekend)
      const employeeWeekendCount = {}
      weekendShifts.forEach(shift => {
        employeeWeekendCount[shift.employee_id] = (employeeWeekendCount[shift.employee_id] || 0) + 1
      })
      
      const counts = Object.values(employeeWeekendCount)
      if (counts.length > 0) {
        const min = Math.min(...counts)
        const max = Math.max(...counts)
        console.log(`Weekend fairness: ${min}-${max} (difference: ${max - min})`)
      }
    }
    
  } catch (error) {
    console.error('❌ Wake up failed:', error)
  }
}

wakeUpAndTest()
