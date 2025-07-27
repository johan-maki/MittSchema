#!/usr/bin/env node

/**
 * 🚨 EXAKT REPRODUKTION av frontend API call för att hitta root cause
 * 
 * Från console log ser vi att:
 * - Start date ISO: 2025-08-01T00:00:00.000Z ✅
 * - End date ISO: 2025-08-31T00:00:00.000Z ✅ 
 * - Expected month: 8 ✅
 * - Gurobi svarade med 93 shifts för augusti ✅
 * 
 * MEN det finns fortfarande 1 shift i september! Varför?
 */

const API_URL = 'https://mittschema-gurobi-backend.onrender.com/optimize-schedule';

const reproduceExactFrontendCall = async () => {
    console.log('🚨 EXAKT REPRODUKTION av frontend API call\n');
    
    // Använd EXAKT samma data som frontend skickade (från console log)
    const frontendRequest = {
        start_date: '2025-08-01T00:00:00.000Z',
        end_date: '2025-08-31T00:00:00.000Z',
        department: 'Akutmottagning',
        random_seed: 252851, // Samma som användes
        optimizer: 'gurobi',
        min_staff_per_shift: 1,
        minimum_staff: 1,
        staff_constraint: 'strict',
        min_experience_per_shift: 1,
        include_weekends: true,
        weekend_penalty_weight: 750,
        fairness_weight: 1.0,
        balance_workload: true,
        max_hours_per_nurse: 40,
        employee_preferences: [
            {
                employee_id: '2a5c284a-7b3c-4bf5-b1b2-fc95d8649f9b',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Sjuksköterska',
                experience_level: 3
            },
            {
                employee_id: 'de2877d1-ceed-4877-aeaa-7f9602ba4826',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Läkare',
                experience_level: 3
            },
            {
                employee_id: '91654b5c-40a7-49b9-a65b-d38280aca200',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Undersköterska',
                experience_level: 2
            },
            {
                employee_id: '1e1c9031-2223-4ea4-b36e-e5f105364198',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Sjuksköterska',
                experience_level: 1
            },
            {
                employee_id: '37efd3a8-12c8-4147-800a-8a450d256a9c',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Läkare',
                experience_level: 1
            },
            {
                employee_id: '3cccafe3-8380-4538-bd2e-f64a04f4e1f9',
                preferred_shifts: ['day', 'night', 'evening'],
                max_shifts_per_week: 5,
                available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                excluded_shifts: [],
                excluded_days: [],
                available_days_strict: false,
                preferred_shifts_strict: false,
                role: 'Undersköterska',
                experience_level: 2
            }
        ]
    };
    
    console.log('📤 Request som skickas (exakt som frontend):');
    console.log('  Start date:', frontendRequest.start_date);
    console.log('  End date:', frontendRequest.end_date);
    console.log('  Employees:', frontendRequest.employee_preferences.length);
    
    try {
        console.log('\n📡 Anropar Gurobi API...');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(frontendRequest)
        });
        
        console.log('Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return;
        }
        
        const result = await response.json();
        
        if (result.schedule && result.schedule.length > 0) {
            // Analysera datum i responsen
            const responseDates = result.schedule.map(shift => shift.date || shift.start_time?.split('T')[0]);
            const uniqueDates = [...new Set(responseDates)].sort();
            
            const monthCounts = {};
            const dateDetails = [];
            
            uniqueDates.forEach(date => {
                const [year, month, day] = date.split('-').map(Number);
                monthCounts[month] = (monthCounts[month] || 0) + 1;
                dateDetails.push({ date, month, year, day });
            });
            
            console.log('\n🔍 DETALJERAD DATUM ANALYS:');
            console.log('  Total shifts:', result.schedule.length);
            console.log('  Unique dates:', uniqueDates.length);
            console.log('  Date range:', uniqueDates[0], 'to', uniqueDates[uniqueDates.length - 1]);
            
            console.log('\n📊 Månadsfördelning:');
            Object.entries(monthCounts).forEach(([month, count]) => {
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                const isExpected = month == '8'; // Augusti
                console.log(`  ${monthNames[month]} (${month}): ${count} dagar ${isExpected ? '✅' : '❌ UNEXPECTED!'}`);
            });
            
            // Hitta alla September shifts
            const septemberShifts = result.schedule.filter(shift => {
                const date = shift.date || shift.start_time?.split('T')[0];
                const [year, month, day] = date.split('-').map(Number);
                return month === 9; // September
            });
            
            if (septemberShifts.length > 0) {
                console.log('\n🚨 SEPTEMBER SHIFTS FOUND:');
                septemberShifts.forEach((shift, i) => {
                    console.log(`  ${i+1}. ${shift.date} - ${shift.employee_name} - ${shift.shift_type}`);
                    console.log(`     start_time: ${shift.start_time}`);
                    console.log(`     end_time: ${shift.end_time}`);
                });
            }
            
            console.log('\n=== ROOT CAUSE ANALYSIS ===');
            if (septemberShifts.length > 0) {
                console.log('❌ GUROBI RETURNERAR FORTFARANDE SEPTEMBER SHIFTS!');
                console.log('   Detta betyder att problemet INTE är i frontend datum-konstruktion');
                console.log('   Problemet ligger i backend create_date_list eller Gurobi själv');
            } else {
                console.log('✅ Inga September shifts - problemet kan vara löst');
            }
            
        } else {
            console.log('❌ Inga shifts genererade av API:et');
        }
        
    } catch (error) {
        console.error('❌ Fel vid API-anrop:', error.message);
    }
};

reproduceExactFrontendCall();
