const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Debugging parameter passing from frontend to Gurobi')

async function debugParameterPassing() {
  try {
    // Test olika kombinationer av parametrar som kan påverka staffing
    const testCases = [
      {
        name: "Only min_staff_per_shift",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2
        }
      },
      {
        name: "Both min_staff_per_shift and minimum_staff",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2
        }
      },
      {
        name: "With staff_constraint strict",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "staff_constraint": "strict"
        }
      },
      {
        name: "Legacy min_nurses_per_shift",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_nurses_per_shift": 2
        }
      },
      {
        name: "All staffing parameters",
        params: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_staff_per_shift": 2,
          "minimum_staff": 2,
          "min_nurses_per_shift": 2,
          "staff_constraint": "strict",
          "enforce_min_staff": true
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
        // Analyze staffing per shift
        const shiftCounts = {}
        result.schedule.forEach(shift => {
          const key = `${shift.date}_${shift.shift_type}`
          shiftCounts[key] = (shiftCounts[key] || 0) + 1
        })
        
        const counts = Object.values(shiftCounts)
        const minStaff = Math.min(...counts)
        const maxStaff = Math.max(...counts)
        const uniqueShifts = Object.keys(shiftCounts).length
        
        console.log(`👥 Staffing: ${minStaff}-${maxStaff} per shift (${uniqueShifts} unique shifts)`)
        
        if (minStaff >= 2) {
          console.log('✅ CORRECT: All shifts have ≥2 staff')
        } else {
          console.log('❌ WRONG: Some shifts have <2 staff')
        }
      }
      
      console.log('---')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugParameterPassing()
