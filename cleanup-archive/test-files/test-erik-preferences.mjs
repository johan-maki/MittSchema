import axios from 'axios';

async function testErikPreferences() {
    console.log('🧪 Testing Erik preferences with Gurobi API...');
    
    // Erik Erikssons data baserat på vad vi vet
    const erikProfile = {
        id: '225e078a-bdb9-4d3e-9274-6c3b5432b4be',
        first_name: 'Erik',
        last_name: 'Eriksson',
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_years: 3,
        salary_per_hour: 350,
        work_preferences: {
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Måndag-Fredag
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }
    };
    
    // Minimalt test med bara Erik
    const testData = {
        start_date: '2025-08-01T00:00:00.000Z',
        end_date: '2025-08-10T23:59:59.999Z', // Kortare period för test
        department: 'Akutmottagning',
        random_seed: 12345,
        optimizer: 'gurobi',
        employees: [erikProfile],
        employee_preferences: [{
            employee_id: erikProfile.id,
            available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"], // Måndag-Fredag
            max_shifts_per_week: 4,
            preferred_shifts: ['morning', 'evening']
        }],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    console.log('📤 Sending test data to Gurobi:');
    console.log('   Employee:', erikProfile.first_name, erikProfile.last_name);
    console.log('   Available days:', testData.employee_preferences[0].available_days);
    console.log('   Date range:', testData.start_date, 'to', testData.end_date);
    
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
        console.log('📊 Generated shifts:', response.data.schedule?.length || 0);
        
        if (response.data.schedule) {
            // Analysera helgpass för Erik
            const erikShifts = response.data.schedule.filter(shift => shift.employee_id === erikProfile.id);
            console.log(`👤 Erik got ${erikShifts.length} shifts`);
            
            const weekendShifts = erikShifts.filter(shift => {
                const date = new Date(shift.date);
                const dayOfWeek = date.getDay();
                return dayOfWeek === 0 || dayOfWeek === 6; // Söndag eller Lördag
            });
            
            console.log(`🎯 Erik weekend shifts: ${weekendShifts.length}`);
            weekendShifts.forEach(shift => {
                const date = new Date(shift.date);
                const dayName = date.getDay() === 0 ? 'Söndag' : 'Lördag';
                console.log(`   ❌ ${dayName} ${shift.date}: ${shift.shift_type}`);
            });
            
            if (weekendShifts.length === 0) {
                console.log('✅ Perfect! Erik got no weekend shifts as expected');
            } else {
                console.log('❌ Problem: Erik got weekend shifts despite preferences');
            }
            
            // Visa alla Eriks shifts
            console.log('\n📅 All Erik shifts:');
            erikShifts.forEach(shift => {
                const date = new Date(shift.date);
                const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
                const dayName = dayNames[date.getDay()];
                console.log(`   ${dayName} ${shift.date}: ${shift.shift_type}`);
            });
        }
        
        // Visa eventuella logs från servern
        if (response.data.logs) {
            console.log('\n📋 Server logs:');
            response.data.logs.forEach(log => console.log('   ', log));
        }
        
    } catch (error) {
        console.error('❌ Error calling Gurobi API:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
    }
}

testErikPreferences().catch(console.error);
