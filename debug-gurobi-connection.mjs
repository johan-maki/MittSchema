const API_URL = "https://mittschema-gurobi-backend.onrender.com"

console.log('🔧 Debugging Gurobi connection issue')

async function debugGurobiConnection() {
  try {
    // Test 1: Basic health check
    console.log('\n1️⃣ Testing health endpoint...')
    const healthResponse = await fetch(`${API_URL}/health`)
    const healthData = await healthResponse.json()
    console.log('Health status:', healthData)
    
    // Test 2: Check what parameters the API expects
    console.log('\n2️⃣ Testing optimize-schedule endpoint...')
    
    // Minimal request first
    const minimalRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07"
    }
    
    console.log('Sending minimal request:', JSON.stringify(minimalRequest, null, 2))
    
    const minimalResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(minimalRequest)
    })
    
    console.log('Minimal response status:', minimalResponse.status)
    console.log('Minimal response headers:', Object.fromEntries(minimalResponse.headers.entries()))
    
    if (!minimalResponse.ok) {
      const errorText = await minimalResponse.text()
      console.log('Minimal error response:', errorText)
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText)
        console.log('Parsed error:', errorJson)
      } catch {
        console.log('Raw error text:', errorText)
      }
    } else {
      const minimalResult = await minimalResponse.json()
      console.log('✅ Minimal request succeeded!')
      console.log('Result keys:', Object.keys(minimalResult))
    }
    
    // Test 3: Check with parameters that worked before
    console.log('\n3️⃣ Testing with working parameters...')
    
    const workingRequest = {
      "start_date": "2025-07-01",
      "end_date": "2025-07-07",
      "min_staff_per_shift": 2,
      "minimum_staff": 2,
      "staff_constraint": "strict",
      "max_hours_per_nurse": 40
    }
    
    console.log('Sending working request:', JSON.stringify(workingRequest, null, 2))
    
    const workingResponse = await fetch(`${API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(workingRequest)
    })
    
    console.log('Working response status:', workingResponse.status)
    
    if (!workingResponse.ok) {
      const errorText = await workingResponse.text()
      console.log('Working error response:', errorText)
    } else {
      const workingResult = await workingResponse.json()
      console.log('✅ Working request succeeded!')
      console.log('Status:', workingResult.optimization_status)
      console.log('Schedule length:', workingResult.schedule?.length || 0)
    }
    
    // Test 4: Check OpenAPI spec for required parameters
    console.log('\n4️⃣ Checking API specification...')
    
    const specResponse = await fetch(`${API_URL}/openapi.json`)
    const spec = await specResponse.json()
    
    const optimizeEndpoint = spec.paths['/optimize-schedule']
    if (optimizeEndpoint && optimizeEndpoint.post) {
      console.log('Required parameters:')
      const schema = optimizeEndpoint.post.requestBody?.content?.['application/json']?.schema
      if (schema) {
        console.log('Request schema properties:', Object.keys(schema.properties || {}))
        console.log('Required fields:', schema.required || [])
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    })
  }
}

debugGurobiConnection()
