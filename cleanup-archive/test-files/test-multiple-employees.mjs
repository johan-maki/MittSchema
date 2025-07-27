#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function testMultipleEmployees() {
  console.log('🔍 Testing with multiple employees including Andreas...');

  // Get all employees
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .limit(5); // Just get first 5 for test

  if (error || !employees) {
    console.log('❌ Error fetching employees:', error);
    return;
  }

  console.log(`📋 Testing with ${employees.length} employees:`);
  employees.forEach(emp => {
    console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.role})`);
  });

  // Convert all to Gurobi format
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

  const employeePreferences = employees.map(emp => {
    const workPrefs = convertWorkPreferences(emp.work_preferences);
    
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
    
    return {
      employee_id: emp.id,
      preferred_shifts: preferredShifts.length > 0 ? preferredShifts : ["day", "evening", "night"],
      max_shifts_per_week: workPrefs.max_shifts_per_week || 5,
      available_days: availableDays.length > 0 ? availableDays : ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      available_days_strict: availableDaysStrict,
      preferred_shifts_strict: preferredShiftsStrict,
      role: emp.role,
      experience_level: emp.experience_level || 1
    };
  });

  console.log('🚀 Employee preferences for Gurobi:');
  employeePreferences.forEach(pref => {
    const emp = employees.find(e => e.id === pref.employee_id);
    console.log(`   ${emp.first_name}: preferred=[${pref.preferred_shifts.join(',')}] strict=${pref.preferred_shifts_strict}`);
  });

  // Create Gurobi request - SIMPLIFIED for testing
  const requestBody = {
    start_date: '2025-08-01',
    end_date: '2025-08-07', // Just one week for testing
    employee_preferences: employeePreferences
  };

  console.log('📤 Sending to Gurobi API...');

  try {
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API error:', response.status, response.statusText);
      console.log('Error details:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Gurobi response received');
    
    if (result.schedule && result.schedule.length > 0) {
      console.log(`📊 Generated ${result.schedule.length} shifts total`);
      
      // Group by employee
      const shiftsByEmployee = {};
      result.schedule.forEach(shift => {
        if (!shiftsByEmployee[shift.employee_id]) {
          shiftsByEmployee[shift.employee_id] = [];
        }
        shiftsByEmployee[shift.employee_id].push(shift);
      });
      
      console.log('\n👤 Shifts per employee:');
      Object.entries(shiftsByEmployee).forEach(([empId, shifts]) => {
        const emp = employees.find(e => e.id === empId);
        const name = emp ? `${emp.first_name} ${emp.last_name}` : empId;
        console.log(`   ${name}: ${shifts.length} shifts`);
        
        // Special check for Andreas
        if (emp && emp.first_name === 'Andreas' && emp.last_name === 'Lundquist') {
          console.log('   📅 ANDREAS SHIFTS:');
          shifts.forEach(shift => {
            console.log(`      - ${shift.date || shift.start_time?.split('T')[0]}: ${shift.shift_type}`);
          });
        }
      });
      
      // Check if Andreas got any shifts
      const andreasId = 'cb319cf9-6688-4d57-b6e6-8a62086b7630';
      const andreasShifts = result.schedule.filter(s => s.employee_id === andreasId);
      
      if (andreasShifts.length === 0) {
        console.log('\n❌ ANDREAS GOT ZERO SHIFTS! This confirms the issue.');
        console.log('🔍 Possible causes:');
        console.log('   1. Gurobi optimization algorithm issue');
        console.log('   2. API server not recognizing his constraints properly');
        console.log('   3. His strict night constraint is blocking ALL assignments');
      } else {
        console.log(`\n✅ Andreas got ${andreasShifts.length} shifts - problem might be elsewhere`);
      }
      
    } else {
      console.log('❌ No schedule generated by Gurobi');
    }

    if (result.message) {
      console.log('💬 Gurobi message:', result.message);
    }

  } catch (error) {
    console.error('❌ Error calling Gurobi API:', error.message);
  }
}

testMultipleEmployees();
