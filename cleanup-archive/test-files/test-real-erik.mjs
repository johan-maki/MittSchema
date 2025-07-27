import axios from 'axios';

async function testRealErikFromDatabase() {
    console.log('🎯 Testing real Erik Eriksson from database...');
    
    // Test with real database employees but small date range focused on weekends
    const testData = {
        start_date: '2025-08-02T00:00:00.000Z',  // Lördag 
        end_date: '2025-08-03T23:59:59.999Z',    // Söndag
        department: 'Akutmottagning',
        random_seed: 777,
        optimizer: 'gurobi',
        // Don't send employees - let backend fetch from database
        employee_preferences: [{
            employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be', // Erik Eriksson's real ID
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Only weekdays
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📤 Testing weekend period with Erik restricted to weekdays:');
    console.log('   Period: Saturday-Sunday only');
    console.log('   Erik available: Monday-Friday only');
    console.log('   Expected: Erik gets 0 shifts (other employees cover weekend)');
    
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
        
        if (response.data.schedule) {
            // Kolla alla skift
            console.log('\n📋 All shifts assigned:');
            response.data.schedule.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                const isErik = shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be';
                const status = isErik ? '👤 ERIK' : '👥 Other';
                console.log(`   ${dayNames[date.getDay()]} ${date.toISOString().split('T')[0]}: ${shift.shift_type} - ${status} (${shift.employee_id.slice(0,8)}...)`);
            });
            
            // Kolla specifikt Eriks skift
            const erikShifts = response.data.schedule.filter(shift => shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be');
            console.log(`\n🎯 Erik Eriksson got ${erikShifts.length} shifts`);
            
            if (erikShifts.length === 0) {
                console.log('✅ SUCCESS: Erik got no shifts during weekend period!');
            } else {
                console.log('❌ PROBLEM: Erik got shifts despite weekend-only period and weekday-only availability!');
                erikShifts.forEach(shift => {
                    const date = new Date(shift.date || shift.start_time);
                    console.log(`   ❌ ${date.toISOString().split('T')[0]}: ${shift.shift_type}`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

testRealErikFromDatabase().catch(console.error);
