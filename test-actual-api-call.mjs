// Test för att se exakt vad som skickas till Gurobi API nu
async function testActualScheduleGeneration() {
  console.log('=== TEST AV SCHEMAGENERERING ===');
  
  // Simulera samma logik som i scheduleGenerationService.ts
  const today = new Date();
  
  let targetYear = today.getFullYear();
  let targetMonth = today.getMonth(); // Current month (0-indexed)
  
  // Increment to next month and handle year rollover
  targetMonth += 1;
  if (targetMonth > 11) {
    targetYear += 1;
    targetMonth = 0;
  }
  
  // Calculate last day
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
  const lastDayOfTargetMonth = targetMonth === 1 && isLeapYear ? 29 : daysInMonth[targetMonth];
  
  const startDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const endDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;
  
  console.log('Idag:', today.toISOString().split('T')[0]);
  console.log('Target år:', targetYear);
  console.log('Target månad (0-indexerad):', targetMonth);
  console.log('Target månad (för människor):', targetMonth + 1);
  console.log('Antal dagar i målmånaden:', lastDayOfTargetMonth);
  console.log('Start datum:', startDateISO);
  console.log('Slut datum:', endDateISO);
  
  // Test API call
  const requestData = {
    start_date: startDateISO,
    end_date: endDateISO,
    department: 'Akutmottagning',
    min_staff_per_shift: 1,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: Date.now(),
    employee_preferences: [
      {
        employee_id: "test-emp-1",
        preferred_shifts: ["day", "evening", "night"],
        max_shifts_per_week: 5,
        available_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        role: "Level5",
        experience_level: 5
      }
    ]
  };
  
  console.log('\n=== DATA SOM SKICKAS TILL GUROBI ===');
  console.log('Start date:', requestData.start_date);
  console.log('End date:', requestData.end_date);
  
  try {
    const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('\n=== GUROBI SVAR ===');
    
    if (result.schedule && result.schedule.length > 0) {
      const dates = result.schedule.map(shift => shift.date || shift.start_time?.split('T')[0]);
      const uniqueDates = [...new Set(dates)].sort();
      
      console.log('Antal shifts returnerade:', result.schedule.length);
      console.log('Första datum:', uniqueDates[0]);
      console.log('Sista datum:', uniqueDates[uniqueDates.length - 1]);
      
      // Kontrollera vilka månader som returneras
      const months = uniqueDates.map(date => {
        const [year, month] = date.split('-');
        return `${year}-${month}`;
      });
      const uniqueMonths = [...new Set(months)];
      
      console.log('Månader i svaret:', uniqueMonths);
      
      // Specifik kontroll av första och sista dagarna
      const firstDayShifts = result.schedule.filter(s => 
        (s.date || s.start_time?.split('T')[0]) === uniqueDates[0]
      );
      const lastDayShifts = result.schedule.filter(s => 
        (s.date || s.start_time?.split('T')[0]) === uniqueDates[uniqueDates.length - 1]
      );
      
      console.log(`\nFörsta dagen (${uniqueDates[0]}):`, firstDayShifts.length, 'shifts');
      firstDayShifts.forEach(shift => {
        console.log(`  - ${shift.shift_type}`);
      });
      
      console.log(`\nSista dagen (${uniqueDates[uniqueDates.length - 1]}):`, lastDayShifts.length, 'shifts');
      lastDayShifts.forEach(shift => {
        console.log(`  - ${shift.shift_type}`);
      });
      
      // Kolla om det finns data utanför förväntad månad
      const expectedMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
      const wrongMonthDates = uniqueDates.filter(date => !date.startsWith(expectedMonth));
      
      if (wrongMonthDates.length > 0) {
        console.log('\n🚨 PROBLEM: Datum utanför förväntad månad:', wrongMonthDates);
      } else {
        console.log('\n✅ Alla datum är inom förväntad månad:', expectedMonth);
      }
      
    } else {
      console.log('Ingen schedule returnerad');
    }

  } catch (error) {
    console.error('Fel vid API-anrop:', error.message);
  }
}

testActualScheduleGeneration();
