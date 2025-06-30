const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🧪 Testing frontend minimum staff setting (1 vs 2 staff per shift)')

async function testMinimumStaffSettings() {
  try {
    const tests = [
      {
        name: "Frontend Setting: 1 staff per shift",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 1,
          "minimum_staff": 1,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 100
        }
      },
      {
        name: "Frontend Setting: 2 staff per shift",
        config: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict",
          "max_hours_per_nurse": 40,
          "weekend_penalty_weight": 100
        }
      }
    ]

    for (const test of tests) {
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
      console.log('Status:', result.optimization_status)
      console.log('Total shifts assigned:', result.schedule?.length || 0)
      
      if (result.schedule) {
        // Count staff per shift
        const shiftStaffing = {}
        result.schedule.forEach(shift => {
          const key = `${shift.date}_${shift.shift_type}`
          if (!shiftStaffing[key]) {
            shiftStaffing[key] = 0
          }
          shiftStaffing[key]++
        })
        
        const uniqueShifts = Object.keys(shiftStaffing).length
        const totalAssignments = result.schedule.length
        const avgStaffPerShift = totalAssignments / uniqueShifts
        
        console.log(`📊 Unique shifts: ${uniqueShifts}`)
        console.log(`📊 Total assignments: ${totalAssignments}`)
        console.log(`📊 Average staff per shift: ${avgStaffPerShift.toFixed(1)}`)
        
        // Check compliance
        const staffCounts = Object.values(shiftStaffing)
        const minStaffActual = Math.min(...staffCounts)
        const maxStaffActual = Math.max(...staffCounts)
        
        console.log(`📊 Staff per shift range: ${minStaffActual} - ${maxStaffActual}`)
        
        if (test.config.min_staff_per_shift === 1) {
          if (minStaffActual >= 1) {
            console.log('✅ Meets minimum 1 staff requirement')
          } else {
            console.log('❌ Violates minimum 1 staff requirement')
          }
        } else if (test.config.min_staff_per_shift === 2) {
          if (minStaffActual >= 2) {
            console.log('✅ Meets minimum 2 staff requirement')
          } else {
            console.log('❌ Violates minimum 2 staff requirement')
          }
        }
        
        console.log('---')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testMinimumStaffSettings()
