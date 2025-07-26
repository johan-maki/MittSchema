#!/usr/bin/env node

// Debug: Test the exact flow from frontend to Gurobi with Erik's preferences

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function testFrontendToGurobiFlow() {
  console.log('🔍 Testing frontend-to-Gurobi flow with Erik preferences...\n');
  
  // Simulate Erik's updated preferences (no weekends)
  const erikPreferencesNoWeekends = {
    employee_id: "erik-eriksson", // Using a generic ID
    preferred_shifts: ["day", "evening", "night"], // All shifts
    max_shifts_per_week: 5,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] // NO Saturday/Sunday
  };
  
  // Simulate other employees with default preferences
  const defaultEmployee = {
    preferred_shifts: ["day", "evening", "night"],
    max_shifts_per_week: 5,
    available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  };
  
  const employeePreferences = [
    erikPreferencesNoWeekends,
    { ...defaultEmployee, employee_id: "maria-johansson" },
    { ...defaultEmployee, employee_id: "karin-karlsson" },
    { ...defaultEmployee, employee_id: "david-davidsson" },
    { ...defaultEmployee, employee_id: "sofia-svensson" }
  ];
  
  console.log('👤 Erik\'s preferences (should exclude weekends):');
  console.log(JSON.stringify(erikPreferencesNoWeekends, null, 2));
  
  const requestBody = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-31T23:59:59.999Z',
    department: 'Akutmottagning',
    min_staff_per_shift: 2,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 42,
    employee_preferences: employeePreferences
  };
  
  console.log('\n📤 Sending request to Gurobi API...');
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP Error: ${response.status}`);
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    if (!data.schedule || data.schedule.length === 0) {
      console.log('❌ No schedule generated');
      console.log('Response:', data);
      return;
    }
    
    console.log(`\n✅ Generated ${data.schedule.length} shifts`);
    
    // Find Erik's shifts and check for weekends
    const erikShifts = data.schedule.filter(shift => 
      shift.employee_id === "erik-eriksson" || 
      (shift.employee_name && shift.employee_name.toLowerCase().includes('erik'))
    );
    
    console.log(`\n👤 Erik got ${erikShifts.length} shifts total:`);
    
    const erikWeekendShifts = [];
    const erikWeekdayShifts = [];
    
    erikShifts.forEach(shift => {
      const shiftDate = new Date(shift.start_time);
      const dayOfWeek = shiftDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dayName = shiftDate.toLocaleDateString('en', {weekday: 'long'});
      const dateStr = shiftDate.toLocaleDateString();
      
      console.log(`  - ${dateStr} (${dayName}) ${shift.shift_type} shift`);
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        erikWeekendShifts.push(shift);
      } else {
        erikWeekdayShifts.push(shift);
      }
    });
    
    console.log(`\n📊 Erik's shift breakdown:`);
    console.log(`  🗓️  Weekday shifts: ${erikWeekdayShifts.length}`);
    console.log(`  🏖️  Weekend shifts: ${erikWeekendShifts.length}`);
    
    if (erikWeekendShifts.length === 0) {
      console.log('\n🎉 SUCCESS: Erik has NO weekend shifts - preferences respected!');
    } else {
      console.log('\n⚠️  PROBLEM: Erik has weekend shifts despite preferences!');
      console.log('Weekend shifts:');
      erikWeekendShifts.forEach(shift => {
        const date = new Date(shift.start_time);
        console.log(`  ❌ ${date.toLocaleDateString()} (${date.toLocaleDateString('en', {weekday: 'long'})}) ${shift.shift_type}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testFrontendToGurobiFlow().catch(console.error);
