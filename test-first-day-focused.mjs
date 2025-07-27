// FOKUSERAT TEST: Undersök endast första dagen för att isolera problemet
console.log('=== FÖRSTA DAGEN FOKUSERAT TEST ===');

async function testFirstDayIssue() {
  // Skapa minimal request för första dagen i augusti
  const requestData = {
    start_date: "2025-08-01T00:00:00.000Z",
    end_date: "2025-08-31T23:59:59.999Z", 
    department: "Akutmottagning",
    min_staff_per_shift: 1, // Reducerat från 3 till 1
    include_weekends: true,
    employee_preferences: [
      {
        employee_id: "emp1",
        preferred_shifts: ["night"],
        max_shifts_per_week: 5,
        available_days: ["friday", "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"],
        available_days_strict: false,
        preferred_shifts_strict: true, // Denna ska ENDAST jobba natt
        role: "Level5",
        experience_level: 5
      },
      {
        employee_id: "emp2", 
        preferred_shifts: ["day"],
        max_shifts_per_week: 5,
        available_days: ["friday", "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"],
        available_days_strict: false,
        preferred_shifts_strict: true, // Denna ska ENDAST jobba dag
        role: "Level4",
        experience_level: 4
      },
      {
        employee_id: "emp3",
        preferred_shifts: ["evening"],
        max_shifts_per_week: 5,
        available_days: ["friday", "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"],
        available_days_strict: false,
        preferred_shifts_strict: true, // Denna ska ENDAST jobba kväll
        role: "Level3",
        experience_level: 3
      }
    ]
  };
  
  console.log('Request data:');
  console.log('Start:', requestData.start_date);
  console.log('End:', requestData.end_date);
  console.log('Min staff per shift:', requestData.min_staff_per_shift);
  console.log('Employees:', requestData.employee_preferences.length);
  
  try {
    console.log('\n=== ANROPAR API ===');
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      console.error('❌ API fel:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Fel detaljer:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('\n=== ANALYSERAR FÖRSTA DAGEN ===');
    
    if (result.schedule && result.schedule.length > 0) {
      // Filtrera endast 2025-08-01
      const firstDayShifts = result.schedule.filter(shift => {
        const shiftDate = shift.date || shift.start_time?.split('T')[0];
        return shiftDate === '2025-08-01';
      });
      
      console.log('Shifts första dagen (2025-08-01):', firstDayShifts.length);
      
      const hasDay = firstDayShifts.some(s => s.shift_type === 'day' || s.shift_type === 'dag');
      const hasEvening = firstDayShifts.some(s => s.shift_type === 'evening' || s.shift_type === 'kväll');
      const hasNight = firstDayShifts.some(s => s.shift_type === 'night' || s.shift_type === 'natt');
      
      console.log('Dagskift:', hasDay ? '✅' : '❌');
      console.log('Kvällsskift:', hasEvening ? '✅' : '❌');
      console.log('Nattskift:', hasNight ? '✅' : '❌');
      
      if (firstDayShifts.length === 0) {
        console.log('🚨 PROBLEM: Första dagen har inga skift alls!');
      } else {
        console.log('\nDetaljer för första dagen:');
        firstDayShifts.forEach(shift => {
          console.log(`  - ${shift.shift_type} (${shift.employee_id || shift.employee_name}): ${shift.start_time} - ${shift.end_time}`);
        });
      }
      
      // Kontrollera om september fortfarande har skift
      const septemberShifts = result.schedule.filter(shift => {
        const shiftDate = shift.date || shift.start_time?.split('T')[0];
        return shiftDate && shiftDate.startsWith('2025-09');
      });
      
      console.log('\n=== SEPTEMBER KONTROLL ===');
      console.log('September shifts:', septemberShifts.length);
      
      if (septemberShifts.length > 0) {
        console.log('🚨 PROBLEM: September har fortfarande skift!');
        septemberShifts.slice(0, 3).forEach(shift => {
          console.log(`  - ${shift.date || shift.start_time?.split('T')[0]} ${shift.shift_type}`);
        });
      } else {
        console.log('✅ September är korrekt tom');
      }
      
    } else {
      console.log('❌ Ingen schedule returnerad');
    }
    
  } catch (error) {
    console.error('❌ Nätverksfel:', error.message);
  }
}

testFirstDayIssue();
