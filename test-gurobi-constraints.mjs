#!/usr/bin/env node

import axios from 'axios';

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testGurobiConstraints() {
  console.log('🔍 Testing Gurobi API constraint handling...\n');
  
  // Test 1: Erik with EXTREME constraints - NO available days at all
  console.log('🧪 Test 1: Erik with ZERO available days (extreme test)');
  
  const extremeTest = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-05T23:59:59.999Z', // Short period for testing
    department: 'Akutmottagning',
    min_staff_per_shift: 1,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 12345,
    employee_preferences: [
      {
        employee_id: "225e078a-bdb9-4d3e-9274-6c3b5432b4be", // Erik's real ID
        preferred_shifts: ["day", "evening", "night"],
        max_shifts_per_week: 5,
        available_days: [], // ZERO available days - Erik should get NO shifts
        available_days_strict: true,
        preferred_shifts_strict: false
      }
    ]
  };
  
  try {
    console.log('📤 Sending extreme test to Gurobi...');
    
    const response = await axios.post(`${GUROBI_API_URL}/optimize-schedule`, extremeTest, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    
    if (response.data.schedule) {
      const erikShifts = response.data.schedule.filter(s => 
        s.employee_id === "225e078a-bdb9-4d3e-9274-6c3b5432b4be"
      );
      
      console.log(`📊 Results: Erik got ${erikShifts.length} shifts (should be 0)`);
      
      if (erikShifts.length === 0) {
        console.log('✅ SUCCESS: Gurobi respects available_days constraint!');
      } else {
        console.log('❌ CRITICAL PROBLEM: Gurobi ignores available_days entirely!');
        console.log('Erik shifts despite NO available days:');
        erikShifts.forEach(shift => {
          const date = new Date(shift.date);
          const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
          console.log(`  - ${shift.date} (${dayName}) ${shift.shift_type}`);
        });
      }
    } else {
      console.log('❌ No schedule generated:', response.data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }
  
  console.log('\n🧪 Test 2: Check if parameter is even sent correctly');
  
  // Test 2: Verify what we actually send matches what we think
  const testPayload = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-03T23:59:59.999Z',
    department: 'Akutmottagning',
    min_staff_per_shift: 1,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 12345,
    employee_preferences: [
      {
        employee_id: "225e078a-bdb9-4d3e-9274-6c3b5432b4be",
        preferred_shifts: ["day"],
        max_shifts_per_week: 2,
        available_days: ["monday", "tuesday"], // Only Mon-Tue
        available_days_strict: true,
        preferred_shifts_strict: false
      }
    ]
  };
  
  console.log('📤 Test payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  
  try {
    const response2 = await axios.post(`${GUROBI_API_URL}/optimize-schedule`, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    
    if (response2.data.schedule) {
      const erikShifts2 = response2.data.schedule.filter(s => 
        s.employee_id === "225e078a-bdb9-4d3e-9274-6c3b5432b4be"
      );
      
      console.log(`\n📊 Erik got ${erikShifts2.length} shifts`);
      
      // Check if any shifts are outside Monday/Tuesday
      const invalidShifts = erikShifts2.filter(shift => {
        const date = new Date(shift.date);
        const day = date.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
        return day !== 1 && day !== 2; // Not Monday or Tuesday
      });
      
      if (invalidShifts.length === 0) {
        console.log('✅ SUCCESS: All Erik shifts are on Monday/Tuesday as constrained!');
      } else {
        console.log('❌ PROBLEM: Erik has shifts outside Monday/Tuesday:');
        invalidShifts.forEach(shift => {
          const date = new Date(shift.date);
          const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
          console.log(`  - ${shift.date} (${dayName}) ${shift.shift_type}`);
        });
      }
      
      // Show all Erik's shifts
      console.log('\n📅 All Erik shifts:');
      erikShifts2.forEach(shift => {
        const date = new Date(shift.date);
        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
        console.log(`  - ${shift.date} (${dayName}) ${shift.shift_type}`);
      });
      
    } else {
      console.log('❌ No schedule generated:', response2.data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }
}

testGurobiConstraints().catch(console.error);
