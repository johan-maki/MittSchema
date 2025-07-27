import axios from 'axios';

async function testExtremeConstraints() {
    console.log('🚫 Testing extreme constraints to verify constraint system works...');
    
    // Test med extrema constraints för alla anställda - om constraint-systemet fungerar, 
    // borde det bli infeasible eller mycket få shifts
    const testData = {
        start_date: '2025-08-01T00:00:00.000Z',  
        end_date: '2025-08-07T23:59:59.999Z',    
        department: 'Akutmottagning',
        random_seed: 888,
        optimizer: 'gurobi',
        employee_preferences: [
            // Erik - bara måndag 
            {
                employee_id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be',
                available_days: ["monday"], // Bara måndag!
                max_shifts_per_week: 1,
                preferred_shifts: ['morning']
            },
            // Anna - bara tisdag
            {
                employee_id: 'd364fa09-6da0-4e46-b50b-dcc359400f5e',
                available_days: ["tuesday"], // Bara tisdag!
                max_shifts_per_week: 1,
                preferred_shifts: ['morning']
            },
            // Maria - bara onsdag
            {
                employee_id: 'cd5387d0-35db-46aa-a2fa-94122829875f',
                available_days: ["wednesday"], // Bara onsdag!
                max_shifts_per_week: 1,
                preferred_shifts: ['morning']
            }
        ],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📤 Testing with extreme day restrictions:');
    console.log('   Erik: Only Monday');
    console.log('   Anna: Only Tuesday'); 
    console.log('   Maria: Only Wednesday');
    console.log('   Period: Full week');
    console.log('   Expected: Each person gets max 1 shift on their specific day');
    
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
            // Analysera per person och dag
            const targetEmployees = {
                '225e078a-bdb9-4d3e-9274-6c3b5432b4be': 'Erik (Monday only)',
                'd364fa09-6da0-4e46-b50b-dcc359400f5e': 'Anna (Tuesday only)', 
                'cd5387d0-35db-46aa-a2fa-94122829875f': 'Maria (Wednesday only)'
            };
            
            console.log('\n📋 Shifts for constrained employees:');
            
            Object.entries(targetEmployees).forEach(([empId, name]) => {
                const shifts = response.data.schedule.filter(s => s.employee_id === empId);
                console.log(`\n👤 ${name}: ${shifts.length} shifts`);
                
                shifts.forEach(shift => {
                    const date = new Date(shift.date || shift.start_time);
                    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                    const dayName = dayNames[date.getDay()];
                    
                    // Kontrollera om det är rätt dag
                    let expectedDay = '';
                    if (name.includes('Monday')) expectedDay = 'Mån';
                    else if (name.includes('Tuesday')) expectedDay = 'Tis';
                    else if (name.includes('Wednesday')) expectedDay = 'Ons';
                    
                    const status = dayName === expectedDay ? '✅ Correct day' : '❌ WRONG DAY!';
                    console.log(`     ${dayName} ${date.toISOString().split('T')[0]}: ${shift.shift_type} ${status}`);
                });
            });
            
            // Räkna violations
            let violations = 0;
            response.data.schedule.forEach(shift => {
                const empId = shift.employee_id;
                const date = new Date(shift.date || shift.start_time);
                const weekday = date.getDay(); // 0=Sön, 1=Mån, 2=Tis, 3=Ons
                
                if (empId === '225e078a-bdb9-4d3e-9274-6c3b5432b4be' && weekday !== 1) { // Erik should only work Monday
                    violations++;
                }
                if (empId === 'd364fa09-6da0-4e46-b50b-dcc359400f5e' && weekday !== 2) { // Anna should only work Tuesday
                    violations++;
                }
                if (empId === 'cd5387d0-35db-46aa-a2fa-94122829875f' && weekday !== 3) { // Maria should only work Wednesday
                    violations++;
                }
            });
            
            console.log(`\n🎯 Constraint violations: ${violations}`);
            if (violations === 0) {
                console.log('✅ SUCCESS: All availability constraints respected!');
            } else {
                console.log('❌ PROBLEM: Availability constraints violated - system ignoring available_days!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

testExtremeConstraints().catch(console.error);
