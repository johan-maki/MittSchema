#!/usr/bin/env node

/**
 * 🎯 VERIFIERING AV FIX - Test mot verklig Gurobi API med korrekt slutdatum
 */

const API_URL = 'https://mittschema-gurobi-backend.onrender.com/optimize-schedule';

const testFixedDateFormat = async () => {
    console.log('🎯 TESTAR FIX AGAINST REAL GUROBI API...\n');
    
    // Använd samma datum som frontend nu skickar (med fix)
    const testRequest = {
        start_date: '2025-08-01T00:00:00.000Z',
        end_date: '2025-08-31T00:00:00.000Z', // FIXED: T00:00:00.000Z istället för T23:59:59.999Z
        department: 'Akutmottagning',
        min_staff_per_shift: 1,
        min_experience_per_shift: 1,
        include_weekends: true,
        employee_preferences: [
            {
                employee_id: 'test1',
                preferred_shifts: ['day'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            },
            {
                employee_id: 'test2', 
                preferred_shifts: ['evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            },
            {
                employee_id: 'test3',
                preferred_shifts: ['night'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
        ]
    };
    
    console.log('Request payload:');
    console.log('  Start date:', testRequest.start_date);
    console.log('  End date:', testRequest.end_date);
    console.log('  Employees:', testRequest.employee_preferences.length);
    
    try {
        console.log('\n📡 Anropar Gurobi API...');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testRequest)
        });
        
        console.log('Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return;
        }
        
        const result = await response.json();
        
        if (result.schedule && result.schedule.length > 0) {
            // Analysera månader i responsen
            const responseDates = result.schedule.map(shift => shift.date || shift.start_time?.split('T')[0]);
            const uniqueDates = [...new Set(responseDates)].sort();
            
            const monthCounts = {};
            uniqueDates.forEach(date => {
                const [year, month, day] = date.split('-').map(Number);
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            });
            
            console.log('\n✅ API Response Success:');
            console.log('  Total shifts generated:', result.schedule.length);
            console.log('  Date range:', uniqueDates[0], 'to', uniqueDates[uniqueDates.length - 1]);
            console.log('  Months in response:');
            
            Object.entries(monthCounts).forEach(([month, count]) => {
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                console.log(`    ${monthNames[month]} (${month}): ${count} dagar`);
            });
            
            // Kontrollera om endast augusti (month 8)
            const hasOnlyAugust = Object.keys(monthCounts).length === 1 && monthCounts['8'];
            
            if (hasOnlyAugust) {
                console.log('\n🎉 SUCCESS! API returnerar endast augusti-shifts!');
                console.log('   September-buggen är löst!');
            } else {
                console.log('\n❌ Problem kvarstår - API returnerar shifts för andra månader.');
            }
            
            // Visa första och sista shift för verifiering
            console.log('\nFirst shift:', result.schedule[0]);
            console.log('Last shift:', result.schedule[result.schedule.length - 1]);
            
        } else {
            console.log('❌ Inga shifts genererade av API:et');
        }
        
    } catch (error) {
        console.error('❌ Fel vid API-anrop:', error.message);
    }
};

testFixedDateFormat();
