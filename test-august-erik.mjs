import axios from 'axios';

console.log('🔍 Testing Erik with AUGUST 2025 data (same as frontend)...');

const testData = {
    start_date: '2025-07-31T22:00:00.000Z',  // Samma som frontend
    end_date: '2025-08-31T21:59:59.999Z',    // Samma som frontend
    department: 'Akutmottagning',
    random_seed: 112915,
    optimizer: 'gurobi',
    employee_preferences: [{
        employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be', // Erik
        available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Bara vardagar
        available_days_strict: true,  // HARD constraint
        max_shifts_per_week: 5,
        preferred_shifts: ['day', 'night', 'evening'],
        preferred_shifts_strict: false
    }],
    schedule_config: {
        minStaffPerShift: 1,
        minExperiencePerShift: 1,
        includeWeekends: true
    }
};

console.log('📤 Testing FULL AUGUST month with Erik constraints...');
console.log('   Start: 2025-07-31T22:00:00.000Z (Aug 1 midnight)');
console.log('   End: 2025-08-31T21:59:59.999Z (Aug 31 midnight)');
console.log('   Erik available_days: monday-friday ONLY');
console.log('   Erik available_days_strict: TRUE');
console.log('   Expected: Erik gets ZERO weekend shifts in August');

try {
    const response = await axios.post(
        'https://mittschema-gurobi-backend.onrender.com/optimize-schedule',
        testData,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        }
    );
    
    console.log('✅ Response received');
    console.log('📊 Generated shifts:', response.data.schedule?.length || 0);
    
    if (response.data.schedule) {
        const erikShifts = response.data.schedule.filter(shift => 
            shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be'
        );
        
        console.log(`\n👤 Erik Eriksson got ${erikShifts.length} shifts:`);
        
        let weekendViolations = 0;
        erikShifts.forEach(shift => {
            const date = new Date(shift.date || shift.start_time);
            const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
            const weekday = date.getDay();
            const dayName = dayNames[weekday];
            const isWeekend = weekday === 0 || weekday === 6;
            
            console.log(`  - ${shift.date || shift.start_time.split('T')[0]} (${dayName}) ${shift.shift_type} ${isWeekend ? '❌ WEEKEND VIOLATION' : '✅'}`);
            
            if (isWeekend) {
                weekendViolations++;
            }
        });
        
        console.log(`\n📊 Weekend violations: ${weekendViolations}`);
        
        if (weekendViolations === 0) {
            console.log('🎉 SUCCESS! No weekend violations in full month test');
        } else {
            console.log('❌ PROBLEM: Backend still assigns weekend shifts in full month');
            console.log('🔍 This suggests the bug might be in how backend handles longer periods');
        }
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
        console.error('Response data:', error.response.data);
    }
}
