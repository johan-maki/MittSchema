import axios from 'axios';

async function testErikConstraintsLocal() {
    console.log('🧪 Testing Erik constraints on LOCAL backend (with fix)...');
    
    const testData = {
        start_date: '2025-08-02T00:00:00.000Z',  // Saturday
        end_date: '2025-08-03T23:59:59.999Z',    // Sunday (weekend only)
        department: 'Akutmottagning',
        random_seed: 42,
        optimizer: 'gurobi',
        employee_preferences: [{
            employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be', // Erik Eriksson
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // NO weekends
            available_days_strict: true,  // HARD CONSTRAINT
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
    
    console.log('📤 Testing weekend-only period with Erik weekday-only availability:');
    console.log('   Period: Saturday-Sunday (pure weekend)');
    console.log('   Erik available: Monday-Friday ONLY');
    console.log('   Erik available_days_strict: TRUE');
    console.log('   Expected: Erik gets 0 shifts (constraint should block him)');
    
    try {
        const response = await axios.post(
            'http://localhost:8081/optimize-schedule',  // LOCAL backend
            testData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        console.log('✅ Response received from LOCAL backend');
        console.log('📊 Generated shifts:', response.data.schedule?.length || 0);
        console.log('📊 Optimization status:', response.data.optimization_status);
        
        if (response.data.schedule) {
            // Check Erik's shifts
            const erikShifts = response.data.schedule.filter(shift => 
                shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be'
            );
            
            console.log(`\n🎯 Erik Eriksson got ${erikShifts.length} shifts:`);
            
            if (erikShifts.length === 0) {
                console.log('🎉 SUCCESS: CONSTRAINT FIXED! Erik got 0 weekend shifts!');
                console.log('✅ The local backend respects available_days_strict constraint!');
            } else {
                console.log('❌ PROBLEM: Erik still got shifts despite hard constraint!');
                erikShifts.forEach(shift => {
                    const date = new Date(shift.date || shift.start_time);
                    const dayName = date.toLocaleDateString('en', {weekday: 'long'});
                    console.log(`   ❌ ${date.toISOString().split('T')[0]} (${dayName}): ${shift.shift_type}`);
                });
            }
            
            // Show all shifts for context
            console.log(`\n📋 All shifts generated (${response.data.schedule.length} total):`);
            response.data.schedule.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayName = date.toLocaleDateString('en', {weekday: 'long'});
                console.log(`   ${date.toISOString().split('T')[0]} (${dayName}): ${shift.shift_type} → ${shift.employee_name || shift.employee_id}`);
            });
        } else {
            console.log('ℹ️  No schedule generated - this might be expected if Erik is the only employee and weekend period');
        }
        
    } catch (error) {
        console.error('❌ Error testing local backend:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

testErikConstraintsLocal();
