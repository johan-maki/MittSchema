import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testing Gurobi schedule generation directly...');

// Test data for July 2025
const testData = {
  start_date: '2025-07-01',
  end_date: '2025-07-31',
  department: 'Akutmottagning',
  min_staff_per_shift: 1,
  min_experience_per_shift: 1,
  include_weekends: true,
  random_seed: Math.floor(Math.random() * 1000000) // Smaller random seed
};

console.log('📊 Generating schedule for July 2025...');
console.log('Test parameters:', testData);

try {
  const response = await fetch('http://localhost:8080/optimize-schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, errorText);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✅ Gurobi API Response:');
  console.log(`  🎯 Total shifts: ${result.schedule?.length || 0}`);
  console.log(`  📈 Coverage: ${result.coverage_stats?.coverage_percentage || 0}%`);
  console.log(`  ⚖️ Fairness range: ${result.fairness_stats?.total_shifts?.range || 0} shifts`);
  
  if (result.schedule && result.schedule.length > 0) {
    console.log('\n🔍 First 3 shifts:');
    result.schedule.slice(0, 3).forEach((shift, index) => {
      console.log(`  ${index + 1}. ${shift.date} ${shift.shift_type} → Employee ${shift.employee_id}`);
      console.log(`     Time: ${shift.start_time} - ${shift.end_time}`);
    });
    
    // Check for month boundary dates
    const boundaryDates = ['2025-06-30', '2025-07-01', '2025-07-31', '2025-08-01'];
    console.log('\n📅 Boundary date coverage:');
    boundaryDates.forEach(date => {
      const shiftsForDate = result.schedule.filter(s => s.date === date);
      console.log(`  ${date}: ${shiftsForDate.length} shifts`);
      if (shiftsForDate.length > 0) {
        shiftsForDate.forEach(shift => {
          console.log(`    ${shift.shift_type.toUpperCase()}: ${shift.start_time}-${shift.end_time}`);
        });
      }
    });
  }
  
} catch (error) {
  console.error('❌ Error testing Gurobi API:', error);
}
