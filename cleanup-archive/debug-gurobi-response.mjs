const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Testing Gurobi with detailed response analysis')

async function debugGurobiResponse() {
  try {
    // Test with a shorter period first
    const testCases = [
      {
        name: "One week in July",
        data: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-07",
          "min_nurses_per_shift": 2,
          "max_hours_per_nurse": 40
        }
      },
      {
        name: "Full July month",
        data: {
          "start_date": "2025-07-01",
          "end_date": "2025-07-31",
          "min_nurses_per_shift": 2,
          "max_hours_per_nurse": 160
        }
      }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`)
      console.log('📋 Request data:')
      console.log(JSON.stringify(testCase.data, null, 2))
      
      const startTime = Date.now()
      
      const response = await fetch(`${API_URL}/optimize-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      })
      
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      console.log(`\n⏱️  Response time: ${duration.toFixed(1)} seconds`)
      console.log(`📊 Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        
        console.log('\n📄 Full response structure:')
        console.log('Keys in response:', Object.keys(result))
        
        // Log each key and its value/type
        Object.keys(result).forEach(key => {
          const value = result[key]
          if (Array.isArray(value)) {
            console.log(`   ${key}: Array with ${value.length} items`)
            if (value.length > 0) {
              console.log(`     First item keys:`, Object.keys(value[0]))
            }
          } else if (typeof value === 'object' && value !== null) {
            console.log(`   ${key}: Object with keys:`, Object.keys(value))
          } else {
            console.log(`   ${key}: ${typeof value} = ${value}`)
          }
        })
        
        // Look for alternative shift data locations
        const possibleShiftKeys = ['shifts', 'schedule', 'assignments', 'result', 'data', 'shifts_data']
        let foundShifts = false
        
        console.log('\n🔍 Looking for shift data...')
        possibleShiftKeys.forEach(key => {
          if (result[key]) {
            console.log(`   Found '${key}':`, typeof result[key], Array.isArray(result[key]) ? `(${result[key].length} items)` : '')
            if (Array.isArray(result[key]) && result[key].length > 0) {
              console.log(`     Sample item:`, JSON.stringify(result[key][0], null, 2))
              foundShifts = true
            }
          }
        })
        
        if (!foundShifts) {
          console.log('   ❌ No shift arrays found in standard locations')
          console.log('\n📄 Raw response (first 1000 chars):')
          console.log(JSON.stringify(result, null, 2).substring(0, 1000))
        }
        
      } else {
        const errorText = await response.text()
        console.log('❌ Error response:', errorText)
      }
      
      console.log('\n' + '='.repeat(60))
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugGurobiResponse()
