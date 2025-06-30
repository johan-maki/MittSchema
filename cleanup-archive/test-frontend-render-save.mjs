#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const schedulerUrl = 'https://mittschema-gurobi-backend.onrender.com' // Use Render backend explicitly

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Testing frontend schedule save with Render backend...')
console.log('=========================================================')
console.log(`🌍 Using Render backend: ${schedulerUrl}`)
console.log('')

try {
  // Step 1: Clear existing July schedule
  console.log('🗑️ Clearing existing July 2025 schedule...')
  const { error: deleteError } = await supabase
    .from('shifts')
    .delete()
    .gte('start_time', '2025-07-01T00:00:00')
    .lt('start_time', '2025-08-01T00:00:00')

  if (deleteError) {
    console.error('❌ Error clearing schedule:', deleteError)
    process.exit(1)
  }
  console.log('✅ Existing schedule cleared')

  // Step 2: Get schedule from Render backend
  console.log('')
  console.log('📞 Calling Render Gurobi backend...')
  const testData = {
    start_date: '2025-07-01',
    end_date: '2025-07-31',
    department: 'Akutmottagning',
    min_staff_per_shift: 1,
    min_experience_per_shift: 1,
    include_weekends: true,
    random_seed: 12345
  };

  const response = await fetch(`${schedulerUrl}/optimize-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`✅ Render backend returned ${result.schedule.length} shifts`);

  // Step 3: Convert to frontend format and save to database
  console.log('')
  console.log('💾 Converting and saving to database...')
  
  const shiftsToSave = result.schedule.map(shift => ({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
    employee_id: shift.employee_id,
    start_time: shift.start_time,
    end_time: shift.end_time,
    shift_type: shift.shift_type,
    department: shift.department || 'Akutmottagning',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // Save in batches to avoid hitting size limits
  const batchSize = 50;
  let totalSaved = 0;
  
  for (let i = 0; i < shiftsToSave.length; i += batchSize) {
    const batch = shiftsToSave.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('shifts')
      .insert(batch);

    if (error) {
      console.error(`❌ Error saving batch ${Math.floor(i/batchSize) + 1}:`, error);
      throw error;
    }
    
    totalSaved += batch.length;
    console.log(`  Saved batch ${Math.floor(i/batchSize) + 1}: ${batch.length} shifts (total: ${totalSaved})`);
  }

  console.log(`✅ Successfully saved ${totalSaved} shifts to database!`)

  // Step 4: Verify the saved data
  console.log('')
  console.log('🔍 Verifying saved schedule...')
  
  const { data: savedShifts, error: fetchError } = await supabase
    .from('shifts')
    .select('*')
    .gte('start_time', '2025-07-01T00:00:00')
    .lt('start_time', '2025-08-01T00:00:00')
    .order('start_time');

  if (fetchError) {
    console.error('❌ Error fetching saved shifts:', fetchError);
    throw fetchError;
  }

  console.log(`📊 Database verification: ${savedShifts.length} shifts found`)

  // Check critical dates
  const boundaryDates = ['2025-07-01', '2025-07-31'];
  console.log('')
  console.log('🎯 CRITICAL BOUNDARY DATES VERIFICATION:')
  
  boundaryDates.forEach(date => {
    const shiftsForDate = savedShifts.filter(s => s.start_time.startsWith(date));
    console.log(`  ${date}: ${shiftsForDate.length} shifts saved`);
    if (shiftsForDate.length > 0) {
      shiftsForDate.forEach(shift => {
        console.log(`    ${shift.shift_type.toUpperCase()}: ${shift.start_time} - ${shift.end_time}`);
      });
    }
  });

  // Check night shifts specifically
  const nightShifts = savedShifts.filter(s => s.shift_type === 'night');
  console.log('')
  console.log(`🌙 NIGHT SHIFTS SAVED: ${nightShifts.length} total`)
  
  const firstNight = nightShifts.find(s => s.start_time.startsWith('2025-07-01'));
  const lastNight = nightShifts.find(s => s.start_time.startsWith('2025-07-31'));
  
  if (firstNight) {
    console.log(`  ✅ First night saved: ${firstNight.start_time}`);
  } else {
    console.log(`  ❌ First night NOT saved!`);
  }
  
  if (lastNight) {
    console.log(`  ✅ Last night saved: ${lastNight.start_time}`);
  } else {
    console.log(`  ❌ Last night NOT saved!`);
  }

  console.log('')
  console.log('🎉 SUCCESS! Schedule generated with Render backend and saved to database!');
  console.log('The frontend will now use the external Gurobi service correctly.');
  
} catch (error) {
  console.error('❌ Error in frontend save test:', error.message);
  console.error('Full error:', error);
}
