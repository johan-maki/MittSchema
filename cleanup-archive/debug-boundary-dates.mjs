const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Debugging boundary date issues (June 30 - July 31)')

async function debugBoundaryDates() {
  try {
    // Test the exact date range that has the problem
    const testCases = [
      {
        name: "June 30 - July 6 (Week 27)",
        params: {
          "start_date": "2025-06-30",
          "end_date": "2025-07-06",
          "min_staff_per_shift": 2
        }
      },
      {
        name: "July 28 - August 3 (Week 31 with July 31)",
        params: {
          "start_date": "2025-07-28",
          "end_date": "2025-08-03",
          "min_staff_per_shift": 2
        }
      },
      {
        name: "Single day July 31",
        params: {
          "start_date": "2025-07-31",
          "end_date": "2025-07-31",
          "min_staff_per_shift": 2
        }
      },
      {
        name: "Single day June 30",
        params: {
          "start_date": "2025-06-30",
          "end_date": "2025-06-30",
          "min_staff_per_shift": 2
        }
      }
    ]

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`)
      console.log('Parameters:', JSON.stringify(testCase.params, null, 2))
      
      const response = await fetch(`${API_URL}/optimize-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.params)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Failed:', errorText)
        continue
      }
      
      const result = await response.json()
      console.log('✅ Status:', result.optimization_status)
      console.log('📊 Total assignments:', result.schedule?.length || 0)
      
      if (result.schedule) {
        // Group by date and shift type
        const shiftsByDate = {}
        result.schedule.forEach(shift => {
          const date = shift.date
          if (!shiftsByDate[date]) shiftsByDate[date] = {}
          if (!shiftsByDate[date][shift.shift_type]) {
            shiftsByDate[date][shift.shift_type] = []
          }
          shiftsByDate[date][shift.shift_type].push(shift.employee_name)
        })
        
        // Print detailed breakdown
        const sortedDates = Object.keys(shiftsByDate).sort()
        for (const date of sortedDates) {
          console.log(`\n📅 ${date}:`)
          const shifts = shiftsByDate[date]
          
          for (const shiftType of ['Dag', 'Kväll', 'Natt']) {
            const staff = shifts[shiftType] || []
            const count = staff.length
            const status = count >= 2 ? '✅' : '❌'
            console.log(`  ${shiftType}: ${count} staff ${status} - [${staff.join(', ')}]`)
            
            if (count < 2) {
              console.log(`    ⚠️  UNDERSTAFFED: Only ${count} staff for ${shiftType} on ${date}`)
            }
          }
        }
        
        // Check for missing shifts on boundary dates
        const expectedDates = []
        const startDate = new Date(testCase.params.start_date)
        const endDate = new Date(testCase.params.end_date)
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          expectedDates.push(d.toISOString().split('T')[0])
        }
        
        console.log(`\n🔍 Expected dates: ${expectedDates.join(', ')}`)
        console.log(`📊 Actual dates: ${sortedDates.join(', ')}`)
        
        const missingDates = expectedDates.filter(d => !sortedDates.includes(d))
        if (missingDates.length > 0) {
          console.log(`❌ Missing dates: ${missingDates.join(', ')}`)
        }
      }
      
      console.log('---')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugBoundaryDates()
