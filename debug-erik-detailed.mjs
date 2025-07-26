import axios from 'axios';

async function debugErikDetailedTest() {
    console.log('🔍 Detailed debug of Erik Eriksson preferences...');
    
    // Erik Erikssons data
    const erikProfile = {
        id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be',
        first_name: 'Erik',
        last_name: 'Eriksson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_years: 3,
        salary_per_hour: 350,
        work_preferences: {
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }
    };
    
    // Test olika datum för att se veckodagar
    const testData = {
        start_date: '2025-08-01T00:00:00.000Z',  // Fredag
        end_date: '2025-08-10T23:59:59.999Z',    // Söndag 
        department: 'Akutmottagning',
        random_seed: 12345,
        optimizer: 'gurobi',
        employees: [erikProfile],
        employee_preferences: [{
            employee_id: erikProfile.id,
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📅 Date analysis:');
    const startDate = new Date('2025-08-01');
    for (let i = 0; i < 10; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
        const weekday = date.getDay(); // JavaScript: 0=Söndag
        const pythonWeekday = (weekday + 6) % 7; // Python: 0=Måndag
        console.log(`   ${date.toISOString().split('T')[0]}: ${dayNames[weekday]} (JS:${weekday}, Python:${pythonWeekday})`);
    }
    
    console.log('\n📤 Sending test data:');
    console.log('   Available days:', testData.employee_preferences[0].available_days);
    
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
        
        console.log('✅ Gurobi response received');
        
        if (response.data.schedule) {
            const erikShifts = response.data.schedule.filter(shift => shift.employee_id === erikProfile.id);
            console.log(`\n👤 Erik got ${erikShifts.length} shifts:`);
            
            erikShifts.forEach(shift => {
                const date = new Date(shift.date || shift.start_time);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                const weekday = date.getDay();
                const isWeekend = weekday === 0 || weekday === 6;
                const status = isWeekend ? '❌ WEEKEND' : '✅ Weekday';
                console.log(`   ${dayNames[weekday]} ${date.toISOString().split('T')[0]}: ${shift.shift_type} ${status}`);
            });
            
            const weekendShifts = erikShifts.filter(shift => {
                const date = new Date(shift.date || shift.start_time);
                const weekday = date.getDay();
                return weekday === 0 || weekday === 6;
            });
            
            console.log(`\n🎯 Result: Erik got ${weekendShifts.length} weekend shifts`);
            if (weekendShifts.length === 0) {
                console.log('✅ SUCCESS: No weekend shifts assigned!');
            } else {
                console.log('❌ PROBLEM: Weekend shifts assigned despite restrictions!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response:', error.response.data);
        }
    }
}

debugErikDetailedTest().catch(console.error);
