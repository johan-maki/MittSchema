#!/usr/bin/env node

/**
 * Test script to verify that the boundary fix is working in the live backend.
 * This tests the specific bug where first/last days had staffing issues.
 */

import dotenv from 'dotenv';
dotenv.config();

const BACKEND_URL = process.env.VITE_SCHEDULER_API_URL || 'https://mittschema-gurobi-backend.onrender.com';

async function testBoundaryFix() {
    console.log('🧪 Testing boundary fix in live backend...');
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    
    try {
        // Test a short period (2 days) that previously had issues
        const startDate = '2024-06-30';
        const endDate = '2024-07-01';
        
        console.log(`\n📅 Testing period: ${startDate} to ${endDate}`);
        
        const payload = {
            start_date: startDate,
            end_date: endDate,
            department: null,
            random_seed: 42,
            optimizer: "gurobi",
            min_staff_per_shift: 1,
            min_experience_per_shift: 1,
            include_weekends: true
        };
        
        console.log('📤 Sending optimization request...');
        const response = await fetch(`${BACKEND_URL}/optimize-schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ Received optimization result');
        
        if (result.optimization_status?.toLowerCase() !== 'optimal' && result.optimization_status?.toLowerCase() !== 'feasible') {
            console.error('❌ Optimization failed:', result.message || 'Unknown error');
            console.error('Status:', result.optimization_status);
            return false;
        }
        
        // Analyze the results
        const shifts = result.schedule || [];
        console.log(`\n📊 Analysis of ${shifts.length} shifts:`);
        
        // Group shifts by date and shift_type
        const shiftsByDate = {};
        for (const shift of shifts) {
            // Extract date from start_time (assuming format like "2024-06-30T08:00:00")
            const date = shift.start_time.split('T')[0];
            if (!shiftsByDate[date]) {
                shiftsByDate[date] = { day: 0, evening: 0, night: 0 };
            }
            shiftsByDate[date][shift.shift_type]++;
        }
        
        // Check each date
        let allDatesProperlyStaffed = true;
        const dates = Object.keys(shiftsByDate).sort();
        
        for (const date of dates) {
            const staffing = shiftsByDate[date];
            const totalStaff = staffing.day + staffing.evening + staffing.night;
            
            console.log(`\n📅 ${date}:`);
            console.log(`   Day: ${staffing.day}, Evening: ${staffing.evening}, Night: ${staffing.night}`);
            console.log(`   Total: ${totalStaff}`);
            
            // Check for basic staffing requirements
            if (staffing.day === 0 && staffing.evening === 0) {
                console.log('   ⚠️  WARNING: No day or evening staff!');
                allDatesProperlyStaffed = false;
            }
            
            if (totalStaff < 3) {
                console.log('   ⚠️  WARNING: Insufficient total staffing!');
                allDatesProperlyStaffed = false;
            }
            
            if (totalStaff >= 3 && (staffing.day > 0 || staffing.evening > 0)) {
                console.log('   ✅ Properly staffed');
            }
        }
        
        // Check for the specific old bug patterns
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        
        console.log('\n🔍 Checking for specific bug patterns:');
        
        // Check first night shift (should not have 2 employees)
        const firstNightStaff = shiftsByDate[firstDate]?.night || 0;
        if (firstNightStaff === 2) {
            console.log('❌ BUG DETECTED: First night shift has 2 employees (old bug pattern)');
            allDatesProperlyStaffed = false;
        } else {
            console.log(`✅ First night shift properly staffed (${firstNightStaff} employees)`);
        }
        
        // Check last day staffing
        const lastDayStaff = shiftsByDate[lastDate]?.day || 0;
        const lastEveningStaff = shiftsByDate[lastDate]?.evening || 0;
        if (lastDayStaff === 0 && lastEveningStaff === 0) {
            console.log('❌ BUG DETECTED: Last day has no day/evening staff (old bug pattern)');
            allDatesProperlyStaffed = false;
        } else {
            console.log(`✅ Last day properly staffed (day: ${lastDayStaff}, evening: ${lastEveningStaff})`);
        }
        
        console.log('\n' + '='.repeat(50));
        if (allDatesProperlyStaffed) {
            console.log('🎉 SUCCESS: Boundary fix appears to be working!');
            console.log('✅ All dates are properly staffed');
            console.log('✅ No old bug patterns detected');
        } else {
            console.log('❌ FAILURE: Boundary issues still present');
            console.log('💡 The backend may need to be redeployed with the fix');
        }
        
        return allDatesProperlyStaffed;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run the test
testBoundaryFix().then(success => {
    process.exit(success ? 0 : 1);
});
