// Using built-in fetch in Node.js 18+

const GUROBI_API_URL = 'https://mittschema-gurobi-backend.onrender.com/optimize-schedule';

async function testMonthlyPeriod() {
    console.log('🔍 Testing monthly period with Gurobi');
    
    // Test parameters that should work
    const params = {
        start_date: "2025-01-01",
        end_date: "2025-01-31",
        min_staff_per_shift: 2,
        minimum_staff: 2,
        staff_constraint: "strict"
    };
    
    console.log('📋 Parameters:', JSON.stringify(params, null, 2));
    
    try {
        console.log('⏳ Sending request to Gurobi...');
        const response = await fetch(GUROBI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        
        console.log('📋 Full response:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            console.log('❌ Error response:', data);
            return;
        }
        
        console.log(`✅ Status: ${data.optimization_status}`);
        console.log(`📊 Total assignments: ${data.schedule?.length || 0}`);
        
        // Analyze staffing per shift
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
                console.log('❌ WRONG: Some shifts have <2 staff');
                console.log('🔍 Shifts with <2 staff:');
                Object.entries(shiftStaffing).forEach(([shift, count]) => {
                    if (count < 2) {
                        console.log(`   ${shift}: ${count} staff`);
                    }
                });
            } else {
                console.log('✅ CORRECT: All shifts have ≥2 staff');
            }
            
            // Show weekend fairness from response
            if (data.fairness_stats) {
                console.log(`📈 Weekend fairness: ${data.fairness_stats.min_shifts_per_employee}-${data.fairness_stats.max_shifts_per_employee} (range: ${data.fairness_stats.shift_distribution_range})`);
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

// Run the test
testMonthlyPeriod();
