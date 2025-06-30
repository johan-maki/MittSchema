const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔧 Testing frontend API call simulation')

async function testFrontendApiCall() {
  try {
    console.log('\n🌐 Simulating frontend API call...')
    
    // Simulate the exact call frontend would make
    const frontendRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-31",
      "department": "Akutmottagning",
      "random_seed": 123456,
      "optimizer": "gurobi",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "min_experience_per_shift": 0,
      "include_weekends": true,
      "weekend_penalty_weight": 1000,
      "fairness_weight": 0.8,
      "balance_workload": true,
      "max_hours_per_nurse": 40
    }
    
    console.log('Frontend request:', JSON.stringify(frontendRequest, null, 2))
    
    // Test with exact frontend headers
    const response = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Frontend)',
        'Origin': 'http://localhost:5173' // Simulate local dev
      },
      body: JSON.stringify(frontendRequest)
    })
    
    console.log('Response status:', response.status)
    console.log('Response ok:', response.ok)
    
    if (!response.ok) {
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      const errorText = await response.text()
      console.error('❌ Frontend simulation failed:', errorText)
      
      // Check if it's a CORS issue
      if (response.status === 0 || response.type === 'opaque') {
        console.log('🚨 Possible CORS issue detected')
      }
      
      return
    }
    
    const result = await response.json()
    console.log('✅ Frontend simulation succeeded!')
    console.log('Status:', result.optimization_status)
    console.log('Schedule length:', result.schedule?.length || 0)
    
    // Test CORS preflight
    console.log('\n🔍 Testing CORS preflight...')
    
    const preflightResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    })
    
    console.log('Preflight status:', preflightResponse.status)
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers')
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.log('🚨 Network error - mogelijk CORS eller connectivity issue')
    }
  }
}

testFrontendApiCall()
