// Test för att verifiera att Andreas Lundquist (Professor) får pass
import axios from 'axios';

async function testAndreasGetsShifts() {
    console.log('🧪 Testing Andreas Lundquist (Professor) shift assignment...');
    
    const testData = {
        start_date: '2025-08-01T00:00:00.000Z',
        end_date: '2025-08-07T23:59:59.999Z',
        department: 'Akutmottagning',
        random_seed: 42,
        optimizer: 'gurobi',
        employees: [
            {
                id: 'andreas-test-123',
                first_name: 'Andreas',
                last_name: 'Lundquist',
                role: 'Professor',  // Detta var problemet!
                department: 'Akutmottagning',
                experience_level: 1
            },
            {
                id: 'erik-test-456',
                first_name: 'Erik',
                last_name: 'Eriksson', 
                role: 'Sjuksköterska',
                department: 'Akutmottagning',
                experience_level: 3
            }
        ],
        schedule_config: {
            minStaffPerShift: 1,
            minExperiencePerShift: 1,
            includeWeekends: true
        }
    };
    
    try {
        console.log('📤 Sending test to Gurobi with Professor role...');
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
        
        console.log('✅ Response received!');
        console.log('📊 Total shifts generated:', response.data.schedule?.length || 0);
        
        if (response.data.schedule) {
            // Analysera Andreas skift
            const andreasShifts = response.data.schedule.filter(shift => shift.employee_id === 'andreas-test-123');
            console.log(`\n👨‍🏫 Andreas Lundquist (Professor): ${andreasShifts.length} shifts`);
            
            if (andreasShifts.length > 0) {
                console.log('🎉 SUCCESS! Andreas gets shifts now!');
                andreasShifts.forEach(shift => {
                    const date = new Date(shift.date || shift.start_time);
                    console.log(`   ✅ ${date.toISOString().split('T')[0]}: ${shift.shift_type} shift`);
                });
            } else {
                console.log('❌ PROBLEM: Andreas still gets no shifts');
            }
            
            // Analysera Erik för jämförelse
            const erikShifts = response.data.schedule.filter(shift => shift.employee_id === 'erik-test-456');
            console.log(`\n👨‍⚕️ Erik Eriksson (Sjuksköterska): ${erikShifts.length} shifts`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response?.data) {
            console.error('Response error:', error.response.data);
        }
    }
}

testAndreasGetsShifts();
