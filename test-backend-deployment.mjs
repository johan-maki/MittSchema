#!/usr/bin/env node

// Test om nya excluded_shifts constraints fungerar i deployed backend
console.log('=== TESTING DEPLOYED GUROBI BACKEND ===');

const testData = {
  start_date: '2025-07-31',
  end_date: '2025-08-01', // Kort test period
  department: 'Test',
  employee_preferences: [
    {
      employee_id: 'test-andreas',
      preferred_shifts: ['day', 'evening'],
      excluded_shifts: ['night'], // KEY: Detta ska blocka nattskift
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      max_shifts_per_week: 5,
      available_days_strict: false,
      preferred_shifts_strict: false,
      role: 'Test',
      experience_level: 1
    }
  ],
  min_staff_per_shift: 1,
  min_experience_per_shift: 1,
  include_weekends: true
};

async function testNewBackend() {
  try {
    console.log('🚀 Testing excluded_shifts constraint...');
    
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      
      // Check if error mentions excluded_shifts - would indicate backend recognizes the field
      if (errorText.includes('excluded_shifts')) {
        console.log('✅ Backend recognizes excluded_shifts field (good sign!)');
      } else {
        console.log('❌ Backend might not have updated code');
      }
      return;
    }

    const result = await response.json();
    console.log('✅ API Response received');
    
    // Check if Andreas got any night shifts
    const andreasShifts = result.assignments?.filter(a => 
      a.employee === 'test-andreas' || a.employee_id === 'test-andreas'
    ) || [];
    
    const nightShifts = andreasShifts.filter(s => s.shift_type === 'night');
    
    console.log('📊 Results:');
    console.log(`- Total shifts for test-andreas: ${andreasShifts.length}`);
    console.log(`- Night shifts for test-andreas: ${nightShifts.length}`);
    
    if (nightShifts.length === 0) {
      console.log('🎉 SUCCESS: excluded_shifts constraint working!');
    } else {
      console.log('❌ FAILED: excluded_shifts constraint not working');
      console.log('Night shifts assigned:', nightShifts);
    }
    
    // Log backend response structure for debugging
    console.log('📋 Response structure:', Object.keys(result));
    
  } catch (error) {
    console.error('💥 Network/Connection Error:', error.message);
  }
}

testNewBackend();
