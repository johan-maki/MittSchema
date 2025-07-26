#!/usr/bin/env node

// Test script to verify employee preferences are sent to Gurobi API

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testEmployeePreferences() {
  console.log('🧪 Testing Gurobi API with employee preferences...\n');
  
  // Test employee preferences
  const testEmployeePreferences = [
    {
      employee_id: "erik-eriksson-id",
      preferred_shifts: ["day", "evening"], // Erik doesn't want night shifts
      max_shifts_per_week: 4, // Erik wants fewer shifts
      available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] // Erik doesn't want weekends
    },
    {
      employee_id: "maria-johansson-id", 
      preferred_shifts: ["day", "evening", "night"], // Maria can work all shifts
      max_shifts_per_week: 5,
      available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] // Maria can work weekends
    }
  ];
  
  try {
    const response = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: '2025-08-01T00:00:00.000Z',
        end_date: '2025-08-31T23:59:59.999Z',
        department: 'Akutmottagning',
        min_staff_per_shift: 2,
        min_experience_per_shift: 1,
        include_weekends: true,
        random_seed: 12345,
        employee_preferences: testEmployeePreferences
      })
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    
    if (data.schedule && data.schedule.length > 0) {
      console.log(`✅ Generated ${data.schedule.length} shifts with employee preferences`);
      
      // Check if Erik got weekend shifts (he shouldn't)
      const erikWeekendShifts = data.schedule.filter(s => 
        s.employee_id === "erik-eriksson-id" && s.is_weekend
      );
      
      // Check if Erik got night shifts (he shouldn't)
      const erikNightShifts = data.schedule.filter(s => 
        s.employee_id === "erik-eriksson-id" && s.shift_type === "night"
      );
      
      console.log(`📊 Erik weekend shifts: ${erikWeekendShifts.length} (should be 0)`);
      console.log(`📊 Erik night shifts: ${erikNightShifts.length} (should be 0)`);
      
      if (erikWeekendShifts.length === 0 && erikNightShifts.length === 0) {
        console.log('🎉 SUCCESS: Gurobi respected Erik\'s preferences!');
      } else {
        console.log('⚠️  Gurobi may not be fully respecting preferences yet');
      }
      
    } else {
      console.log(`❌ No schedule generated`);
      console.log(`❌ Response:`, data.message || 'No message');
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testEmployeePreferences().catch(console.error);
