// Script to test if the frontend fix works correctly
// This simulates what frontend does after the fix

const API_URL = "https://mittschema-gurobi-backend.onrender.com";

async function testFrontendFix() {
    console.log('🧪 Testing frontend fix - now using min_staff_per_shift: 2 by default');
    
    // Test the EXACT same parameters that frontend now sends
    const frontendParams = {
        start_date: "2025-01-01",
        end_date: "2025-01-07", 
        department: "Akutmottagning",
        random_seed: Math.floor(Math.random() * 1000000),
        optimizer: "gurobi",
        min_staff_per_shift: 2,  // This should now work from frontend!
        minimum_staff: 2,
        staff_constraint: "strict",
        min_experience_per_shift: 1,
        include_weekends: true,
        weekend_penalty_weight: 1500,
        fairness_weight: 1.0,
        balance_workload: true,
        max_hours_per_nurse: 40
    };
    
    console.log('📋 Frontend Parameters (after fix):', JSON.stringify(frontendParams, null, 2));
    
    try {
        const response = await fetch(`${API_URL}/optimize-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store'
            },
            body: JSON.stringify(frontendParams)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('❌ Error response:', data);
            return;
        }
        
        console.log(`✅ Status: ${data.optimization_status}`);
        console.log(`📊 Total assignments: ${data.schedule?.length || 0}`);
        
        if (data.schedule && Array.isArray(data.schedule)) {
            const shiftStaffing = {};
            
            data.schedule.forEach(assignment => {
                const shiftKey = `${assignment.date}_${assignment.shift_type}`;
                if (!shiftStaffing[shiftKey]) {
                    shiftStaffing[shiftKey] = 0;
                }
                shiftStaffing[shiftKey]++;
            });
            
            const staffingCounts = Object.values(shiftStaffing);
            const minStaff = Math.min(...staffingCounts);
            const maxStaff = Math.max(...staffingCounts);
            const uniqueShifts = Object.keys(shiftStaffing).length;
            
            console.log(`👥 Staffing: ${minStaff}-${maxStaff} per shift (${uniqueShifts} unique shifts)`);
            
            if (minStaff < 2) {
                console.log('❌ STILL BROKEN: Some shifts have <2 staff');
                console.log('🔍 Shifts with <2 staff:');
                Object.entries(shiftStaffing)
                    .filter(([shift, count]) => count < 2)
                    .slice(0, 5)
                    .forEach(([shift, count]) => {
                        console.log(`   ${shift}: ${count} staff`);
                    });
            } else {
                console.log('✅ FIXED: All shifts have ≥2 staff! 🎉');
            }
            
            // Show fairness stats
            if (data.fairness_stats) {
                console.log(`📈 Fairness: ${data.fairness_stats.min_shifts_per_employee}-${data.fairness_stats.max_shifts_per_employee} shifts per person`);
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

// Test with longer period too
async function testLongerPeriod() {
    console.log('\n🧪 Testing longer period (2 weeks) with fix');
    
    const longerParams = {
        start_date: "2025-01-01",
        end_date: "2025-01-14",
        department: "Akutmottagning", 
        random_seed: Math.floor(Math.random() * 1000000),
        optimizer: "gurobi",
        min_staff_per_shift: 2,
        minimum_staff: 2,
        staff_constraint: "strict",
        min_experience_per_shift: 1,
        include_weekends: true,
        weekend_penalty_weight: 1500,
        fairness_weight: 1.0,
        balance_workload: true,
        max_hours_per_nurse: 40
    };
    
    try {
        const response = await fetch(`${API_URL}/optimize-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store'
            },
            body: JSON.stringify(longerParams)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.log('❌ Error response:', data);
            return;
        }
        
        console.log(`✅ Status: ${data.optimization_status}`);
        
        if (data.schedule && Array.isArray(data.schedule)) {
            const shiftStaffing = {};
            
            data.schedule.forEach(assignment => {
                const shiftKey = `${assignment.date}_${assignment.shift_type}`;
                if (!shiftStaffing[shiftKey]) {
                    shiftStaffing[shiftKey] = 0;
                }
                shiftStaffing[shiftKey]++;
            });
            
            const staffingCounts = Object.values(shiftStaffing);
            const minStaff = Math.min(...staffingCounts);
            const maxStaff = Math.max(...staffingCounts);
            const uniqueShifts = Object.keys(shiftStaffing).length;
            
            console.log(`👥 Staffing: ${minStaff}-${maxStaff} per shift (${uniqueShifts} unique shifts)`);
            console.log(`📊 Total assignments: ${data.schedule.length}`);
            
            if (minStaff >= 2) {
                console.log('✅ EXCELLENT: Longer period also works correctly! 🚀');
            } else {
                console.log('❌ Issue persists with longer periods');
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

async function runTests() {
    await testFrontendFix();
    await testLongerPeriod();
}

runTests();
