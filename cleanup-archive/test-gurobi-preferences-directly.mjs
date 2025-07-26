#!/usr/bin/env node

// Test Gurobi API directly to see if it handles employee preferences

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testGurobiPreferences() {
  console.log('🔍 Testing if Gurobi API respects employee preferences...\n');
  
  // Test 1: Send request with Erik having NO available days (extreme test)
  console.log('🧪 Test 1: Erik with NO available days');
  const extremeTest = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-31T23:59:59.999Z',
    department: 'Akutmottagning',
    min_staff_per_shift: 2,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 123,
    employee_preferences: [
      {
        employee_id: "225e078a-bdb9-4d3e-9274-6c3b5432b4be", // Erik's actual ID
        preferred_shifts: ["day", "evening", "night"],
        max_shifts_per_week: 5,
        available_days: [] // NO DAYS AVAILABLE!
      }
    ]
  };
  
  try {
    const response = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extremeTest)
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    
    if (!data.schedule) {
      console.log('❌ No schedule returned');
      return;
    }
    
    const erikShifts = data.schedule.filter(s => 
      s.employee_id === "225e078a-bdb9-4d3e-9274-6c3b5432b4be"
    );
    
    console.log(`📊 Erik got ${erikShifts.length} shifts with NO available days`);
    
    if (erikShifts.length === 0) {
      console.log('✅ SUCCESS: Gurobi respects constraints - Erik got 0 shifts when unavailable');
    } else {
      console.log('❌ PROBLEM: Gurobi ignores employee preferences entirely!');
      console.log('Erik should have 0 shifts but got:', erikShifts.length);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  console.log('\n🔍 Test 2: Check if Gurobi API even accepts employee_preferences parameter');
  console.log('Looking at API documentation or code...');
  
  // Test 2: Send without employee_preferences to see if there's a difference
  console.log('\n🧪 Test 2: Request WITHOUT employee_preferences');
  const noPrefsTest = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-31T23:59:59.999Z',
    department: 'Akutmottagning',
    min_staff_per_shift: 2,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 123
    // NO employee_preferences parameter
  };
  
  try {
    const response2 = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noPrefsTest)
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      const erikShifts2 = data2.schedule?.filter(s => 
        s.employee_id === "225e078a-bdb9-4d3e-9274-6c3b5432b4be"
      ) || [];
      
      console.log(`📊 Without preferences: Erik got ${erikShifts2.length} shifts`);
      console.log('This suggests Gurobi API may not be processing employee_preferences parameter');
    }
    
  } catch (error) {
    console.log(`❌ Test 2 failed: ${error.message}`);
  }
}

testGurobiPreferences().catch(console.error);
