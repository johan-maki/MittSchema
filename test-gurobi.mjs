import fetch from 'node-fetch';

async function testGurobiAPI() {
  try {
    console.log('🔍 Testing Gurobi API directly...');
    
    const testData = {
      start_date: '2025-08-01T00:00:00.000Z',
      end_date: '2025-08-31T23:59:59.999Z',
      department: 'Akutmottagning',
      random_seed: 12345,
      optimizer: 'gurobi',
      employee_preferences: [
        {
          employee_id: '1',
          name: 'Erik Eriksson',
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          available_days_strict: true,
          preferred_shifts: ['day', 'evening', 'night'],
          preferred_shifts_strict: false,
          max_shifts_per_week: 5
        },
        {
          employee_id: '2',
          name: 'Anna Andersson',
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          available_days_strict: false,
          preferred_shifts: ['day', 'evening', 'night'],
          preferred_shifts_strict: false,
          max_shifts_per_week: 5
        },
        {
          employee_id: '3',
          name: 'Björn Björnsson',
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          available_days_strict: false,
          preferred_shifts: ['day', 'evening', 'night'],
          preferred_shifts_strict: false,
          max_shifts_per_week: 5
        },
        {
          employee_id: '4',
          name: 'Clara Carlsson',
          available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          available_days_strict: false,
          preferred_shifts: ['day', 'evening', 'night'],
          preferred_shifts_strict: false,
          max_shifts_per_week: 5
        }
      ],
      staffing_requirements: {
        morning_shift: { min_staff: 2, start_time: '06:00', end_time: '14:00' },
        afternoon_shift: { min_staff: 2, start_time: '12:00', end_time: '20:00' },
        night_shift: { min_staff: 1, start_time: '22:00', end_time: '06:00' }
      }
    };
    
    console.log('📤 Sending test request to Gurobi API...');
    console.log('Employee preferences:', JSON.stringify(testData.employee_preferences, null, 2));
    
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error(errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API Response received');
    console.log('Schedule length:', result.schedule?.length);
    console.log('Optimization status:', result.optimization_status);
    console.log('Message:', result.message);
    
    // Show all shifts by employee
    console.log('\n📊 Shifts by employee:');
    const shiftsByEmployee = {};
    result.schedule?.forEach(shift => {
      if (!shiftsByEmployee[shift.employee_id]) {
        shiftsByEmployee[shift.employee_id] = [];
      }
      shiftsByEmployee[shift.employee_id].push(shift);
    });
    
    Object.keys(shiftsByEmployee).forEach(empId => {
      const shifts = shiftsByEmployee[empId];
      console.log(`  Employee ${empId}: ${shifts.length} shifts`);
    });
    
    // Check if Erik has weekend shifts
    const erikShifts = result.schedule?.filter(shift => shift.employee_id === '1') || [];
    console.log(`Erik shifts: ${erikShifts.length}`);
    
    const weekendShifts = erikShifts.filter(shift => {
      const date = new Date(shift.shift_date);
      return date.getDay() === 0 || date.getDay() === 6;
    });
    
    console.log(`Erik weekend shifts: ${weekendShifts.length}`);
    
    if (weekendShifts.length > 0) {
      console.log('🚨 PROBLEM: Erik got weekend shifts!');
      weekendShifts.forEach(shift => {
        const date = new Date(shift.shift_date);
        const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
        console.log(`  ${shift.shift_date} (${dayName}) - ${shift.shift_type}`);
      });
    } else {
      console.log('✅ Good: Erik has no weekend shifts');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGurobiAPI();
