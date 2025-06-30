import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Adding missing July 31 shifts...');

// Get an employee ID
const { data: employees } = await supabase.from('employees').select('id').limit(1);
const employeeId = employees[0]?.id;

if (!employeeId) {
  console.error('❌ No employees found');
  process.exit(1);
}

// Create shifts for July 31
const july31Shifts = [
  {
    id: uuidv4(),
    date: '2025-07-31',
    start_time: '2025-07-31T06:00:00+00:00',
    end_time: '2025-07-31T14:00:00+00:00',
    shift_type: 'day',
    department: 'Akutmottagning',
    employee_id: employeeId,
    is_published: false // Make it unpublished to match test theme
  },
  {
    id: uuidv4(),
    date: '2025-07-31',
    start_time: '2025-07-31T14:00:00+00:00',
    end_time: '2025-07-31T22:00:00+00:00',
    shift_type: 'evening',
    department: 'Akutmottagning',
    employee_id: employeeId,
    is_published: false
  },
  {
    id: uuidv4(),
    date: '2025-07-31',
    start_time: '2025-07-31T22:00:00+00:00',
    end_time: '2025-08-01T06:00:00+00:00',
    shift_type: 'night',
    department: 'Akutmottagning',
    employee_id: employeeId,
    is_published: false
  }
];

console.log(`📊 Adding ${july31Shifts.length} shifts for July 31...`);

const { error } = await supabase.from('shifts').insert(july31Shifts);

if (error) {
  console.error('❌ Error adding shifts:', error);
} else {
  console.log('✅ July 31 shifts added successfully!');
  console.log('🔍 Now testing boundary dates again...');
  
  // Verify the fix
  const { data: boundaryShifts } = await supabase
    .from('shifts')
    .select('date, shift_type')
    .in('date', ['2025-07-30', '2025-07-31'])
    .order('date')
    .order('start_time');
    
  console.log('\n📅 Boundary dates verification:');
  ['2025-07-30', '2025-07-31'].forEach(date => {
    const shifts = boundaryShifts.filter(s => s.date === date);
    console.log(`  ${date}: ${shifts.length} shifts (${shifts.map(s => s.shift_type).join(', ')})`);
  });
}
