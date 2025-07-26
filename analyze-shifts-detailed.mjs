import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

console.log('🔍 Detailed analysis of recent shifts...');

try {
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select('employee_id, employee_name, date, shift_type')
    .gte('date', '2025-08-01')
    .lte('date', '2025-08-31')
    .order('date')
    .limit(10);
    
  if (error) {
    console.error('❌ Error fetching shifts:', error);
    process.exit(1);
  }
  
  if (!shifts || shifts.length === 0) {
    console.log('❌ No shifts found in August 2025');
    process.exit(0);
  }
    
  console.log('Recent August shifts:');
  shifts.forEach(shift => {
    console.log(`  📅 ${shift.date} - ID: ${shift.employee_id.substring(0,8)}... - Name: ${shift.employee_name || 'UNDEFINED'} - Type: ${shift.shift_type}`);
  });
  
  // Get employee names for reference
  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .limit(3);
    
  console.log('\n👥 Employee reference:');
  employees.forEach(emp => {
    console.log(`  ${emp.id.substring(0,8)}... - ${emp.first_name} ${emp.last_name}`);
  });
  
  // Count shifts by employee_id to see who actually got shifts
  const shiftCounts = {};
  shifts.forEach(shift => {
    if (!shiftCounts[shift.employee_id]) {
      shiftCounts[shift.employee_id] = 0;
    }
    shiftCounts[shift.employee_id]++;
  });
  
  console.log('\n📊 Shifts by employee_id:');
  Object.entries(shiftCounts).forEach(([id, count]) => {
    console.log(`  ${id.substring(0,8)}...: ${count} shifts`);
  });
  
  // Check specifically for Andreas
  const andreasId = 'cb319cf9-6688-4d57-b6e6-8a62086b7630';
  const andreasShifts = shifts.filter(s => s.employee_id === andreasId);
  console.log(`\n🎯 Andreas (${andreasId.substring(0,8)}...) got: ${andreasShifts.length} shifts`);
  
} catch (err) {
  console.error('❌ Error:', err.message);
}
