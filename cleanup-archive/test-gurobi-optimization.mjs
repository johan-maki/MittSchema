const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🎯 Testing actual Gurobi API with 10 nurses and minimum 2 per shift')

async function testGurobiOptimization() {
  try {
    // Test the schedule optimization endpoint based on what we might see in docs
    const endpoints = [
      '/schedule/optimize',
      '/schedule/generate',
      '/optimize-schedule',
      '/generate-optimal-schedule'
    ]
    
    const testData = {
      year: 2025,
      month: 7,
      constraints: {
        min_nurses_per_shift: 2,
        max_hours_per_nurse: 160
      }
    }
    
    console.log('📋 Test data:')
    console.log(JSON.stringify(testData, null, 2))
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔗 Testing: POST ${API_URL}${endpoint}`)
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        })
        
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.status === 200) {
          console.log('   ✅ Found working endpoint!')
          const result = await response.json()
          console.log('   Result:', JSON.stringify(result, null, 2))
          return
        } else if (response.status !== 404) {
          const text = await response.text()
          console.log(`   Response: ${text}`)
        }
        
      } catch (error) {
        console.log(`   Error: ${error.message}`)
      }
    }
    
    // Try simpler test data format
    console.log('\n🔄 Trying simpler data format...')
    
    const simpleData = {
      "year": 2025,
      "month": 7
    }
    
    const moreEndpoints = [
      '/schedule',
      '/generate',
      '/optimize'
    ]
    
    for (const endpoint of moreEndpoints) {
      try {
        console.log(`\n🔗 Testing simple: POST ${API_URL}${endpoint}`)
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(simpleData)
        })
        
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.status === 200) {
          console.log('   ✅ Found working endpoint!')
          const result = await response.json()
          console.log('   Result preview:', JSON.stringify(result, null, 2).substring(0, 500))
          return
        } else if (response.status !== 404) {
          const text = await response.text()
          console.log(`   Response: ${text.substring(0, 200)}`)
        }
        
      } catch (error) {
        console.log(`   Error: ${error.message}`)
      }
    }
    
    console.log('\n⚠️  Could not find working schedule generation endpoint')
    console.log('Please check the /docs page for correct API usage')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testGurobiOptimization()
