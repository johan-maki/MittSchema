import axios from 'axios';

console.log('🧪 Testing if deployed backend has the fix...');

const testData = {
    start_date: '2025-01-04', // Lördag  
    end_date: '2025-01-05',   // Söndag
    employee_preferences: [{
        employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be', // Erik
        available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Bara vardagar
        available_days_strict: true,  // HARD constraint
        max_shifts_per_week: 4,
        preferred_shifts: ['morning', 'evening'],
        preferred_shifts_strict: false
    }],
    schedule_config: {
        minStaffPerShift: 1,
        minExperiencePerShift: 1,
        includeWeekends: true
    }
};

console.log('📤 Testing weekend-only period with weekday-only constraint...');
console.log('   Expected: Erik gets 0 shifts (fix working) or weekend shifts (fix not deployed yet)');

try {
    const response = await axios.post(
        'https://mittschema-gurobi-backend.onrender.com/optimize-schedule',
        testData,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        }
    );
    
    console.log('✅ Response received');
    console.log('📊 Generated shifts:', response.data.schedule?.length || 0);
    
    if (response.data.schedule) {
        const erikShifts = response.data.schedule.filter(shift => 
            shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be'
        );
        
        console.log(`\n👤 Erik Eriksson got ${erikShifts.length} shifts:`);
        
        if (erikShifts.length === 0) {
            console.log('🎉 SUCCESS! Fix is deployed - Erik correctly gets 0 weekend shifts');
            console.log('✅ The available_days_strict constraint is now working!');
        } else {
            console.log('⏳ Fix not deployed yet - Erik still getting weekend shifts:');
            erikShifts.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                const weekday = date.getDay();
                const dayName = dayNames[weekday];
                console.log(`  - ${shift.date || shift.start_time.split('T')[0]} (${dayName}) ${shift.shift_type}`);
            });
            console.log('\n⚠️  Render deployment may still be in progress...');
        }
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
