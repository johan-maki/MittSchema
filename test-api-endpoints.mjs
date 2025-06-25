const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔍 Testing available API endpoints...')

async function testApiEndpoints() {
  const endpoints = [
    '/',
    '/health',
    '/employees',
    '/generate-schedule',
    '/api/employees',
    '/api/generate-schedule'
  ]
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 Testing: ${API_URL}${endpoint}`)
      const response = await fetch(`${API_URL}${endpoint}`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const text = await response.text()
        if (text.length > 500) {
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

testApiEndpoints()
