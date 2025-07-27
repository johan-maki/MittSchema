#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function testAndreasGurobi() {
  console.log('🔍 Testing Andreas Lundquist with Gurobi API (simplified)...');

  // Get Andreas data
  const { data: andreas, error } = await supabase
    .from('employees')
    .select('*')
    .eq('first_name', 'Andreas')
    .eq('last_name', 'Lundquist')
    .single();

  if (error || !andreas) {
    console.log('❌ Andreas not found:', error);
    return;
  }

  console.log('📋 Andreas work preferences:');
  console.log(JSON.stringify(andreas.work_preferences, null, 2));

  // Extract preferences exactly like the real code does
  function convertWorkPreferences(workPrefs) {
    if (!workPrefs) return {
      max_shifts_per_week: 5,
      day_constraints: {
        monday: { available: true, strict: false },
        tuesday: { available: true, strict: false },
        wednesday: { available: true, strict: false },
        thursday: { available: true, strict: false },
        friday: { available: true, strict: false },
        saturday: { available: true, strict: false },
        sunday: { available: true, strict: false }
      },
      shift_constraints: {
        day: { preferred: true, strict: false },
        evening: { preferred: true, strict: false },
        night: { preferred: true, strict: false }
      }
    };
    return workPrefs;
  }

  const workPrefs = convertWorkPreferences(andreas.work_preferences);
  
  // Convert to Gurobi format exactly like the real code
  const availableDays = Object.entries(workPrefs.day_constraints)
    .filter(([_, constraint]) => constraint.available)
    .map(([day, _]) => day);
    
  const preferredShifts = Object.entries(workPrefs.shift_constraints)
    .filter(([_, constraint]) => constraint.preferred)
    .map(([shift, _]) => shift);
  
  const availableDaysStrict = Object.entries(workPrefs.day_constraints)
    .some(([_, constraint]) => constraint.strict);
    
  const preferredShiftsStrict = Object.entries(workPrefs.shift_constraints)
    .some(([_, constraint]) => constraint.strict);
  
  const gurobiPreference = {
    employee_id: andreas.id,
    preferred_shifts: preferredShifts.length > 0 ? preferredShifts : ["day", "evening", "night"],
    max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
    available_days: availableDays.length > 0 ? availableDays : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    available_days_strict: availableDaysStrict,
    preferred_shifts_strict: preferredShiftsStrict
  };

  console.log('🚀 Andreas preferences converted for Gurobi:');
  console.log(JSON.stringify(gurobiPreference, null, 2));

  // Create the exact request structure that the real code uses
  const requestBody = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-31T21:59:59.999Z',
    department: 'Akutmottagning',
    random_seed: 123456,
    optimizer: "gurobi",
    min_staff_per_shift: 2,
    minimum_staff: 2,
    staff_constraint: "strict",
    min_experience_per_shift: 1,
    include_weekends: true,
    weekend_penalty_weight: 1500,
    fairness_weight: 1.0,
    balance_workload: true,
    max_hours_per_nurse: 40,
    employee_preferences: [gurobiPreference]
  };

  console.log('📤 Sending request to Gurobi:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API error:', response.status, response.statusText);
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Gurobi response received');
    
    if (result.schedule) {
      const andreasShifts = result.schedule.filter(s => s.employee_id === andreas.id);
      console.log(`👤 Andreas got ${andreasShifts.length} shifts from Gurobi`);
      
      if (andreasShifts.length > 0) {
        console.log('📅 Andreas shifts:');
        andreasShifts.forEach(shift => {
          console.log(`  - ${shift.date}: ${shift.shift_type} (${shift.start_time} - ${shift.end_time})`);
        });
      } else {
        console.log('❌ Andreas got ZERO shifts - investigating why...');
        console.log('💡 Possible reasons:');
        console.log('   1. His preferences are too restrictive');
        console.log('   2. He conflicts with strict staffing requirements');
        console.log('   3. Gurobi optimization excludes him for some reason');
        
        // Show other employees for comparison
        if (result.schedule.length > 0) {
          console.log('\n📊 Other employees got shifts:');
          const otherEmployees = {};
          result.schedule.forEach(shift => {
            if (!otherEmployees[shift.employee_id]) {
              otherEmployees[shift.employee_id] = [];
            }
            otherEmployees[shift.employee_id].push(shift);
          });
          
          Object.entries(otherEmployees).forEach(([empId, shifts]) => {
            console.log(`   ${empId}: ${shifts.length} shifts`);
          });
        }
      }
    }

    // Show optimization status
    if (result.optimization_status) {
      console.log('🔧 Optimization status:', result.optimization_status);
    }
    
    if (result.message) {
      console.log('💬 Gurobi message:', result.message);
    }

  } catch (error) {
    console.error('❌ Error calling Gurobi API:', error.message);
  }
}

testAndreasGurobi();
