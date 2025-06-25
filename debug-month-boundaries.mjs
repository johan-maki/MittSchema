import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Analyzing month boundary shifts...');

// Get shifts for the boundary dates
const { data: shifts, error } = await supabase
  .from('shifts')
  .select(`
    *,
    profiles:employees!shifts_employee_id_fkey (
      id,
      first_name,
      last_name
    )
  `)
  .in('date', ['2025-06-30', '2025-07-31'])
  .order('date', { ascending: true })
  .order('start_time', { ascending: true });

if (error) {
  console.error('❌ Error fetching shifts:', error);
} else {
  console.log(`\n📊 Found ${shifts.length} shifts for boundary dates:`);
  
  const june30 = shifts.filter(s => s.date === '2025-06-30');
  const july31 = shifts.filter(s => s.date === '2025-07-31');
  
  console.log('\n📅 June 30, 2025 (last day of June):');
  if (june30.length === 0) {
    console.log('  ❌ NO SHIFTS FOUND!');
  } else {
    june30.forEach(shift => {
      const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
      console.log(`  ${shift.shift_type.toUpperCase()}: ${shift.start_time}-${shift.end_time} → ${employee}`);
    });
  }
  
  console.log('\n📅 July 31, 2025 (last day of July):');
  if (july31.length === 0) {
    console.log('  ❌ NO SHIFTS FOUND!');
  } else {
    july31.forEach(shift => {
      const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
      console.log(`  ${shift.shift_type.toUpperCase()}: ${shift.start_time}-${shift.end_time} → ${employee}`);
    });
  }
}

// Also check what the backend thinks should be generated
console.log('\n🔧 Testing backend date generation for July 2025...');

try {
  const response = await fetch('https://mittschema-gurobi-backend.onrender.com/optimize-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: '2025-07-01',
      end_date: '2025-07-31'
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('📊 Backend date generation test:');
    console.log(`  Total dates: ${data.dates.length}`);
    console.log(`  First date: ${data.dates[0]}`);
    console.log(`  Last date: ${data.dates[data.dates.length - 1]}`);
    console.log(`  Contains July 31: ${data.dates.includes('2025-07-31') ? '✅ YES' : '❌ NO'}`);
    
    // Check for specific boundary dates
    const boundaryDates = ['2025-06-30', '2025-07-01', '2025-07-31'];
    boundaryDates.forEach(date => {
      console.log(`  Contains ${date}: ${data.dates.includes(date) ? '✅ YES' : '❌ NO'}`);
    });
  } else {
    console.log('❌ Backend test endpoint not available');
  }
} catch (err) {
  console.log('❌ Could not test backend date generation:', err.message);
}
