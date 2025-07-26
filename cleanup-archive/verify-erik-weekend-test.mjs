#!/usr/bin/env node

// Verify that Erik's weekend preferences are respected in generated schedules

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com';

async function verifyErikWeekendConstraint() {
  console.log('🔍 Verifying Erik\'s weekend constraint in real schedule...\n');
  
  // Test with actual schedule generation request (similar to frontend)
  const scheduleRequest = {
    start_date: '2025-08-01T00:00:00.000Z',
    end_date: '2025-08-31T23:59:59.999Z', 
    department: 'Akutmottagning',
    min_staff_per_shift: 2,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: Date.now(), // Different seed each time
    // Note: employee_preferences will be fetched from DB by scheduleGenerationService
  };
  
  try {
    console.log('📤 Sending schedule generation request...');
    const response = await fetch(`${GUROBI_API_URL}/optimize-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleRequest)
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }
    
    const data = await response.json();
    
    if (!data.schedule || data.schedule.length === 0) {
      console.log('❌ No schedule generated');
      return;
    }
    
    console.log(`✅ Generated ${data.schedule.length} shifts total\n`);
    
    // Find Erik's shifts
    const erikShifts = data.schedule.filter(shift => {
      // Check for Erik by name patterns
      return shift.employee_name && (
        shift.employee_name.toLowerCase().includes('erik') ||
        shift.employee_id?.includes('erik')
      );
    });
    
    console.log(`👤 Erik got ${erikShifts.length} shifts total`);
    
    if (erikShifts.length === 0) {
      console.log('ℹ️  Erik not found in schedule - check employee name matching');
      
      // Show some example employees for debugging
      const uniqueEmployees = [...new Set(data.schedule.map(s => s.employee_name))];
      console.log('🔍 Available employees:', uniqueEmployees.slice(0, 5));
      return;
    }
    
    // Check for weekend shifts
    const erikWeekendShifts = erikShifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      const dayOfWeek = shiftDate.getDay(); // 0 = Sunday, 6 = Saturday
      return dayOfWeek === 0 || dayOfWeek === 6; // Saturday or Sunday
    });
    
    console.log(`📅 Erik's weekend shifts: ${erikWeekendShifts.length}`);
    
    if (erikWeekendShifts.length === 0) {
      console.log('🎉 SUCCESS: Erik has NO weekend shifts - preferences respected!');
    } else {
      console.log('⚠️  WARNING: Erik has weekend shifts despite preferences');
      console.log('Weekend shifts:');
      erikWeekendShifts.forEach(shift => {
        const date = new Date(shift.start_time);
        console.log(`  - ${date.toLocaleDateString()} (${date.toLocaleDateString('en', {weekday: 'long'})}) ${shift.shift_type}`);
      });
    }
    
    // Show Erik's shifts by day of week
    const shiftsByDay = {};
    erikShifts.forEach(shift => {
      const date = new Date(shift.start_time);
      const dayName = date.toLocaleDateString('en', {weekday: 'long'});
      shiftsByDay[dayName] = (shiftsByDay[dayName] || 0) + 1;
    });
    
    console.log('\n📊 Erik\'s shifts by day of week:');
    Object.entries(shiftsByDay).forEach(([day, count]) => {
      console.log(`  ${day}: ${count} shifts`);
    });
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

verifyErikWeekendConstraint().catch(console.error);
