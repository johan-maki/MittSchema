const API_URL = "https://mittschema-gurobi-backend.onrender.com"

async function findEndpoints() {
  // Test common schedule generation endpoints
  const scheduleEndpoints = [
    '/schedule',
    '/generate',
    '/optimize',
    '/gurobi',
    '/solve',
    '/api/schedule',
    '/api/generate',
    '/api/optimize'
  ]
  
  console.log('🎯 Looking for schedule generation endpoints...')
  
  for (const endpoint of scheduleEndpoints) {
    try {
      console.log(`\n📝 Testing POST to: ${API_URL}${endpoint}`)
      
      const testData = {
        year: 2025,
        month: 7,
        min_nurses_per_shift: 2
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.status !== 404) {
        const text = await response.text()
        if (text.length > 300) {
          console.log(`   Response: ${text.substring(0, 200)}... (truncated)`)
        } else {
          console.log(`   Response: ${text}`)
        }
      }
      
    } catch (error) {
      console.log(`   Error: ${error.message}`)
    }
  }
  
  // Test GET endpoints
  const getEndpoints = [
    '/docs',
    '/routes',
    '/api',
    '/ping',
    '/status'
  ]
  
  console.log('\n🔍 Testing GET endpoints...')
  
  for (const endpoint of getEndpoints) {
    try {
      console.log(`\n🔗 Testing GET: ${API_URL}${endpoint}`)
      const response = await fetch(`${API_URL}${endpoint}`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const text = await response.text()
        if (text.length > 300) {
          console.log(`   Content: ${text.substring(0, 200)}... (truncated)`)
        } else {
          console.log(`   Content: ${text}`)
        }
      }
    } catch (error) {
      console.log(`   Error: ${error.message}`)
    }
  }
}

findEndpoints()
