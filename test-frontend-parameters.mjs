// Using built-in fetch in Node.js 18+

const API_URL = "https://mittschema-gurobi-backend.onrender.com";

async function testFrontendParameters() {
    console.log('🔍 Testing what frontend sends vs working parameters\n');
    
    // 1. Test known working parameters
    console.log('1️⃣ Test: Known working parameters (direct API)');
    const workingParams = {
        start_date: "2025-01-01",
        end_date: "2025-01-07",
        min_staff_per_shift: 2,
        minimum_staff: 2,
        staff_constraint: "strict"
    };
    
    await testParameters('Working Direct API', workingParams);
    
    console.log('\n---\n');
    
    // 2. Test typical frontend parameters (what frontend actually sends)
    console.log('2️⃣ Test: Frontend-style parameters');
    const frontendParams = {
        start_date: "2025-01-01",
        end_date: "2025-01-07",
        min_staff_per_shift: 2,
        fairness_weight: 0.3,
        weekend_penalty: 100  // This should NOT affect min staffing
    };
    
    await testParameters('Frontend Style', frontendParams);
    
    console.log('\n---\n');
    
    // 3. Test with only min_staff_per_shift
    console.log('3️⃣ Test: Only min_staff_per_shift');
    const minimalParams = {
        start_date: "2025-01-01", 
        end_date: "2025-01-07",
        min_staff_per_shift: 2
    };
    
    await testParameters('Minimal Parameters', minimalParams);
    
    console.log('\n---\n');
    
    // 4. Test longer period like frontend uses
    console.log('4️⃣ Test: Longer period (2 weeks) like frontend');
    const longerParams = {
        start_date: "2025-01-01",
        end_date: "2025-01-14",
        min_staff_per_shift: 2,
        fairness_weight: 0.3
    };
    
    await testParameters('Longer Period', longerParams);
}

async function testParameters(testName, params) {
    console.log(`📋 ${testName} Parameters:`, JSON.stringify(params, null, 2));
    
    try {
        const response = await fetch(`${API_URL}/optimize-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
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
            
            if (minStaff < 2) {
                console.log('❌ PROBLEM: Some shifts have <2 staff');
                // Show first few problematic shifts
                const problematicShifts = Object.entries(shiftStaffing)
                    .filter(([shift, count]) => count < 2)
                    .slice(0, 5);
                
                console.log('🔍 First few shifts with <2 staff:');
                problematicShifts.forEach(([shift, count]) => {
                    console.log(`   ${shift}: ${count} staff`);
                });
            } else {
                console.log('✅ CORRECT: All shifts have ≥2 staff');
            }
        }
        
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

// Run the test
testFrontendParameters();
