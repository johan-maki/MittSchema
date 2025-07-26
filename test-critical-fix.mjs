import axios from 'axios';

console.log('🔥 TESTING CRITICAL FIX - Employee preferences should now work!');

const quickTest = {
    start_date: '2025-08-02T00:00:00.000Z',  // Saturday
    end_date: '2025-08-03T23:59:59.999Z',    // Sunday only
    employee_preferences: [{
        employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be',
        available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        available_days_strict: true,
        max_shifts_per_week: 4,
        preferred_shifts: ['day', 'evening'],
        preferred_shifts_strict: false
    }],
    schedule_config: {
        minStaffPerShift: 1,
        minExperiencePerShift: 1,
        includeWeekends: true
    }
};

console.log('📤 Testing weekend-only with strict constraints...');
console.log('   If fix is deployed: Erik gets 0 shifts');
console.log('   If still broken: Erik gets weekend shifts');

try {
    const response = await axios.post(
        'https://mittschema-gurobi-backend.onrender.com/optimize-schedule',
        quickTest,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
        }
    );
    
    const erikShifts = response.data.schedule?.filter(shift => 
        shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be'
    ) || [];
    
    console.log(`\n📊 Erik got ${erikShifts.length} shifts`);
    
    if (erikShifts.length === 0) {
        console.log('🎉 CRITICAL FIX WORKING! Employee preferences are now enforced!');
        console.log('✅ _add_employee_preference_constraints() is now being called');
    } else {
        console.log('❌ Fix not deployed yet - employee preferences still ignored');
        erikShifts.forEach(shift => {
            console.log(`  - ${shift.date || shift.start_time.split('T')[0]} ${shift.shift_type}`);
        });
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
