import axios from 'axios';

async function testHardConstraintsForErik() {
    console.log('🔒 Testing HARD constraints for Erik Eriksson...');
    
    // Test med hard constraints - Erik ska inte kunna få helgpass alls
    const testData = {
        start_date: '2025-08-01T00:00:00.000Z',  
        end_date: '2025-08-07T23:59:59.999Z',    
        department: 'Akutmottagning',
        random_seed: 999,
        optimizer: 'gurobi',
        employee_preferences: [{
            employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be', // Erik Eriksson
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Bara vardagar
            available_days_strict: true,  // HARD CONSTRAINT - MÅSTE följas
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening'],
            preferred_shifts_strict: false  // Soft constraint för shift-typer
        }],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📤 Testing with HARD day constraints:');
    console.log('   Erik available_days: monday-friday ONLY');
    console.log('   Erik available_days_strict: TRUE (hard constraint)');
    console.log('   Expected: Erik gets ZERO weekend shifts (physically impossible to assign)');
    
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
            // Analysera Eriks skift
            const erikShifts = response.data.schedule.filter(shift => shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be');
            console.log(`\n👤 Erik Eriksson got ${erikShifts.length} shifts:`);
            
            let weekendViolations = 0;
            erikShifts.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                const weekday = date.getDay();
                const isWeekend = weekday === 0 || weekday === 6;
                const status = isWeekend ? '❌ WEEKEND (VIOLATION!)' : '✅ Weekday (OK)';
                
                if (isWeekend) weekendViolations++;
                
                console.log(`   ${dayNames[weekday]} ${date.toISOString().split('T')[0]}: ${shift.shift_type} ${status}`);
            });
            
            console.log(`\n🎯 Result: Erik got ${weekendViolations} weekend shifts`);
            if (weekendViolations === 0) {
                console.log('✅ SUCCESS: Hard constraint worked! No weekend shifts assigned!');
            } else {
                console.log('❌ PROBLEM: Hard constraint failed! Weekend shifts still assigned!');
            }
            
            // Visa alla andra skift för kontext
            const allShifts = response.data.schedule;
            const weekendShifts = allShifts.filter(shift => {
                const date = new Date(shift.date || shift.start_time);
                const weekday = date.getDay();
                return weekday === 0 || weekday === 6;
            });
            
            console.log(`\n📊 Overall weekend shifts: ${weekendShifts.length} total`);
            const erikWeekendShifts = weekendShifts.filter(shift => shift.employee_id === '225e078a-bdb9-4d3e-9274-6c3b5432b4be');
            console.log(`📊 Erik weekend shifts: ${erikWeekendShifts.length} (should be 0)`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

testHardConstraintsForErik().catch(console.error);
