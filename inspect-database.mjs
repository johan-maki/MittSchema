#!/usr/bin/env node

/**
 * 🔍 SUPABASE DATABASE INSPECTION
 * 
 * Console log visar:
 * - "Retrieved 92 shifts from Supabase" för augusti
 * - "Retrieved 1 shifts from Supabase" för september
 * 
 * Gurobi genererade 93 shifts och sparade dem, men augusti visar bara 92.
 * Det betyder att 1 shift hamnade i september!
 * 
 * Låt oss kontrollera vad som verkligen finns i databasen.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ebyvourlaomcwitpibdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5Njk5MTIsImV4cCI6MjA0ODU0NTkxMn0.9JgcM1Wky8VgzKJo7qoSWAeLUWwCdlJEWoE_wHa1vBA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inspectDatabase = async () => {
    console.log('🔍 INSPECTING SUPABASE DATABASE FOR SHIFTS\n');
    
    try {
        // Hämta alla shifts från augusti och september
        console.log('📋 Hämtar shifts från augusti 2025...');
        const { data: augustShifts, error: augustError } = await supabase
            .from('shifts')
            .select('id, date, start_time, end_time, employee_id, shift_type')
            .gte('start_time', '2025-08-01T00:00:00.000Z')
            .lte('start_time', '2025-08-31T23:59:59.999Z')
            .order('start_time');
            
        if (augustError) {
            console.error('❌ Error fetching august shifts:', augustError);
        } else {
            console.log(`📊 Augusti shifts i databasen: ${augustShifts?.length || 0}`);
        }
        
        console.log('\n📋 Hämtar shifts från september 2025...');
        const { data: septemberShifts, error: septemberError } = await supabase
            .from('shifts')
            .select('id, date, start_time, end_time, employee_id, shift_type')
            .gte('start_time', '2025-09-01T00:00:00.000Z')
            .lte('start_time', '2025-09-30T23:59:59.999Z')
            .order('start_time');
            
        if (septemberError) {
            console.error('❌ Error fetching september shifts:', septemberError);
        } else {
            console.log(`📊 September shifts i databasen: ${septemberShifts?.length || 0}`);
            
            if (septemberShifts && septemberShifts.length > 0) {
                console.log('\n🚨 SEPTEMBER SHIFTS FOUND I DATABASEN:');
                septemberShifts.forEach((shift, i) => {
                    console.log(`  ${i+1}. ID: ${shift.id}`);
                    console.log(`     Date: ${shift.date}`);
                    console.log(`     Start time: ${shift.start_time}`);
                    console.log(`     End time: ${shift.end_time}`);
                    console.log(`     Employee: ${shift.employee_id}`);
                    console.log(`     Shift type: ${shift.shift_type}`);
                    console.log('');
                });
            }
        }
        
        // Hämta alla shifts från hela perioden för att se mönster
        console.log('\n📋 Hämtar alla shifts från augusti-september range...');
        const { data: allShifts, error: allError } = await supabase
            .from('shifts')
            .select('id, date, start_time, end_time, employee_id, shift_type')
            .gte('start_time', '2025-08-01T00:00:00.000Z')
            .lte('start_time', '2025-09-02T00:00:00.000Z')
            .order('start_time');
            
        if (allError) {
            console.error('❌ Error fetching all shifts:', allError);
        } else {
            console.log(`📊 Totala shifts i perioden: ${allShifts?.length || 0}`);
            
            // Analysera månadsfördelning
            const monthCounts = {};
            allShifts?.forEach(shift => {
                const startTime = new Date(shift.start_time);
                const month = startTime.getMonth() + 1; // 1-indexerat
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            });
            
            console.log('\n📊 Månadsfördelning i databasen:');
            Object.entries(monthCounts).forEach(([month, count]) => {
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
                const isExpected = month == '8'; // Augusti
                console.log(`  ${monthNames[month]} (${month}): ${count} shifts ${isExpected ? '✅' : '❌'}`);
            });
        }
        
        console.log('\n=== SLUTSATS ===');
        console.log('Om det finns September shifts i databasen så är problemet:');
        console.log('1. Clearing-funktionen täcker inte alla September shifts');
        console.log('2. Nya shifts sparas med fel datum från Gurobi response');
        console.log('3. Det finns gamla shifts som inte clearats korrekt');
        
    } catch (error) {
        console.error('❌ Database inspection error:', error);
    }
};

inspectDatabase();
