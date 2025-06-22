import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing frontend schedule generation and saving...');

// Simulate what frontend does - get the Gurobi response and save it
const testData = {
  start_date: '2025-07-01',
  end_date: '2025-07-31',
  department: 'Akutmottagning',
  min_staff_per_shift: 1,
  min_experience_per_shift: 1,
  include_weekends: true,
  random_seed: 12345
};

try {
  // Step 1: Get schedule from Gurobi
  console.log('📞 Calling Gurobi API...');
  const response = await fetch('http://localhost:8080/optimize-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ Gurobi returned ${result.schedule.length} shifts`);

  // Step 2: Convert to frontend format (like the frontend does)
  const shiftsToSave = result.schedule.map(shift => ({
    id: `temp-${Math.random().toString(36).substr(2, 9)}`,
    date: shift.date, // This should now be included
    start_time: shift.start_time,
    end_time: shift.end_time,
    shift_type: shift.shift_type,
    department: shift.department || 'Akutmottagning',
    employee_id: shift.employee_id,
    is_published: false
  }));

  console.log('🔍 Sample converted shift:', shiftsToSave[0]);

  // Step 3: Save to Supabase (like saveScheduleToSupabase does)
  console.log('💾 Saving to Supabase...');
  
  // Clear existing unpublished shifts first
  const { error: clearError } = await supabase
    .from('shifts')
    .delete()
    .eq('is_published', false);
    
  if (clearError) {
    console.error('❌ Error clearing shifts:', clearError);
    throw clearError;
  }

  // Insert new shifts
  const { error: insertError } = await supabase
    .from('shifts')
    .insert(shiftsToSave);
    
  if (insertError) {
    console.error('❌ Error inserting shifts:', insertError);
    throw insertError;
  }

  console.log('✅ Successfully saved to Supabase!');

  // Step 4: Verify the saved data
  console.log('🔍 Verifying saved data...');
  const { data: savedShifts, error: queryError } = await supabase
    .from('shifts')
    .select('date, shift_type, start_time, end_time')
    .eq('is_published', false)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (queryError) {
    console.error('❌ Error querying shifts:', queryError);
    throw queryError;
  }

  console.log(`📊 Verification - Found ${savedShifts.length} saved shifts`);
  
  // Check for boundary dates
  const boundaryDates = ['2025-07-01', '2025-07-31'];
  boundaryDates.forEach(date => {
    const shiftsForDate = savedShifts.filter(s => s.date === date);
    console.log(`  ${date}: ${shiftsForDate.length} shifts`);
    if (shiftsForDate.length > 0) {
      shiftsForDate.forEach(shift => {
        console.log(`    ${shift.shift_type.toUpperCase()}: ${shift.start_time}-${shift.end_time}`);
      });
    }
  });

  // Check for null dates
  const nullDates = savedShifts.filter(s => s.date === null);
  if (nullDates.length > 0) {
    console.log(`❌ WARNING: ${nullDates.length} shifts have null dates!`);
  } else {
    console.log('✅ All shifts have proper dates!');
  }

} catch (error) {
  console.error('❌ Error:', error);
}
