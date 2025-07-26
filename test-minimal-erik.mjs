import axios from 'axios';

async function testMinimalErikCase() {
    console.log('🧪 Minimal test case for Erik availability...');
    
    // Superminimal test - bara lördag och söndag med Erik som inte är tillgänglig
    const testData = {
        start_date: '2025-08-02T00:00:00.000Z',  // Lördag
        end_date: '2025-08-03T23:59:59.999Z',    // Söndag
        department: 'Akutmottagning',
        random_seed: 999,
        optimizer: 'gurobi',
        employees: [{
            id: 'erik-test-123',
            first_name: 'Erik',
            last_name: 'Eriksson',
            role: 'Sjuksköterska',
            department: 'Akutmottagning',
            experience_years: 3,
            salary_per_hour: 350
        }],
        employee_preferences: [{
            employee_id: 'erik-test-123',
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Bara vardagar
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📤 Testing pure weekend with weekday-only employee:');
    console.log('   Dates: 2025-08-02 (Lördag) to 2025-08-03 (Söndag)');
    console.log('   Erik available: monday-friday only');
    console.log('   Expected result: 0 shifts assigned (infeasible or empty schedule)');
    
    try {
        const response = await axios.post(
            'https://mittschema-gurobi-backend.onrender.com/optimize-schedule',
            testData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        console.log('✅ Response received');
        console.log('📊 Generated shifts:', response.data.schedule?.length || 0);
        console.log('📊 Optimization status:', response.data.optimization_status);
        console.log('📊 Message:', response.data.message);
        
        if (response.data.schedule && response.data.schedule.length > 0) {
            console.log('\n❌ PROBLEM: Shifts were assigned during weekend-only period!');
            response.data.schedule.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                console.log(`   ${dayNames[date.getDay()]} ${date.toISOString().split('T')[0]}: ${shift.shift_type} for ${shift.employee_id}`);
            });
        } else {
            console.log('✅ SUCCESS: No shifts assigned (as expected for unavailable employee)');
        }
        
    } catch (error) {
        console.error('❌ Error or infeasible solution:', error.message);
        if (error.response?.data) {
            console.log('Response data:', error.response.data);
        }
    }
}

testMinimalErikCase().catch(console.error);
