/**
 * Test route optimization backend integration
 * Tests the /api/route/optimize-route endpoint
 */

const API_URL = process.env.VITE_SCHEDULER_API_URL || 'https://mittschema-gurobi-backend.onrender.com';

async function testRouteOptimization() {
  console.log('🧪 Testing Route Optimization Backend\n');
  console.log(`Using API: ${API_URL}\n`);

  // Test 1: Health check
  console.log('📋 Test 1: Health Check');
  try {
    const healthResponse = await fetch(`${API_URL}/api/route/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', JSON.stringify(healthData, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  // Test 2: Demo customers
  console.log('\n📋 Test 2: Load Demo Customers');
  try {
    const demoResponse = await fetch(`${API_URL}/api/route/demo-customers`);
    const demoData = await demoResponse.json();
    console.log(`✅ Loaded ${demoData.customers?.length || 0} demo customers`);
    console.log('First customer:', JSON.stringify(demoData.customers?.[0], null, 2));
  } catch (error) {
    console.error('❌ Demo customers failed:', error.message);
  }

  // Test 3: Geocoding
  console.log('\n📋 Test 3: Geocode Address');
  try {
    const geocodeResponse = await fetch(`${API_URL}/api/route/geocode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'Drottninggatan 1, Stockholm' })
    });
    const geocodeData = await geocodeResponse.json();
    console.log('✅ Geocoded address:', JSON.stringify(geocodeData, null, 2));
  } catch (error) {
    console.error('❌ Geocoding failed:', error.message);
  }

  // Test 4: Route Optimization
  console.log('\n📋 Test 4: Optimize Route');
  const testCustomers = [
    {
      id: '1',
      name: 'Anna Andersson',
      address: 'Vasagatan 10, Stockholm',
      latitude: 59.3326,
      longitude: 18.0649,
      serviceTime: 30,
      priority: 'high'
    },
    {
      id: '2',
      name: 'Bengt Bengtsson',
      address: 'Kungsgatan 20, Stockholm',
      latitude: 59.3345,
      longitude: 18.0632,
      serviceTime: 45,
      priority: 'medium'
    },
    {
      id: '3',
      name: 'Cecilia Carlsson',
      address: 'Sveavägen 30, Stockholm',
      latitude: 59.3363,
      longitude: 18.0586,
      serviceTime: 30,
      priority: 'medium'
    }
  ];

  try {
    const optimizeResponse = await fetch(`${API_URL}/api/route/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customers: testCustomers,
        optimization_criteria: 'minimize_distance',
        startLocation: [59.3293, 18.0686], // Stockholm centrum
        max_route_time: 480,
        vehicle_speed_kmh: 40.0
      })
    });

    const optimizeData = await optimizeResponse.json();
    
    if (optimizeData.success) {
      console.log('✅ Route optimization successful!');
      console.log(`   Total Distance: ${optimizeData.totalDistance?.toFixed(2)} km`);
      console.log(`   Total Time: ${optimizeData.totalTime?.toFixed(0)} minutes`);
      console.log(`   Optimized Order:`);
      optimizeData.customers?.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} - ${customer.address}`);
      });
      
      if (optimizeData.routeInstructions) {
        console.log('\n   Route Instructions:');
        optimizeData.routeInstructions.slice(0, 3).forEach(instruction => {
          console.log(`   - ${instruction}`);
        });
      }
    } else {
      console.log('⚠️  Route optimization failed (using fallback)');
      console.log('   Error:', optimizeData.error);
      if (optimizeData.fallback_route) {
        console.log(`   Fallback Distance: ${optimizeData.fallback_route.totalDistance?.toFixed(2)} km`);
        console.log(`   Fallback Time: ${optimizeData.fallback_route.totalTime?.toFixed(0)} minutes`);
      }
    }
  } catch (error) {
    console.error('❌ Route optimization failed:', error.message);
  }

  console.log('\n🎉 Tests complete!\n');
}

// Run tests
testRouteOptimization().catch(console.error);
