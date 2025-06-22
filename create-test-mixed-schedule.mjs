import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Creating test schedule with mixed publication status...');

// First clear all shifts
console.log('🗑️ Clearing all existing shifts...');
await supabase.from('shifts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

// Get an employee ID
const { data: employees } = await supabase.from('employees').select('id').limit(1);
const employeeId = employees[0]?.id;

if (!employeeId) {
  console.error('❌ No employees found');
  process.exit(1);
}

// Create test shifts - some published, some not
const testShifts = [
  // Published shifts (July 1-15)
  ...Array.from({ length: 15 }, (_, i) => {
    const date = new Date(2025, 6, i + 1); // July 1-15
    return [
      {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        start_time: `${date.toISOString().split('T')[0]}T06:00:00+00:00`,
        end_time: `${date.toISOString().split('T')[0]}T14:00:00+00:00`,
        shift_type: 'day',
        department: 'Akutmottagning',
        employee_id: employeeId,
        is_published: true // PUBLISHED
      },
      {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        start_time: `${date.toISOString().split('T')[0]}T14:00:00+00:00`,
        end_time: `${date.toISOString().split('T')[0]}T22:00:00+00:00`,
        shift_type: 'evening',
        department: 'Akutmottagning',
        employee_id: employeeId,
        is_published: true // PUBLISHED
      }
    ];
  }).flat(),
  
  // Unpublished shifts (July 16-31)
  ...Array.from({ length: 16 }, (_, i) => {
    const date = new Date(2025, 6, i + 16); // July 16-31
    return [
      {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        start_time: `${date.toISOString().split('T')[0]}T06:00:00+00:00`,
        end_time: `${date.toISOString().split('T')[0]}T14:00:00+00:00`,
        shift_type: 'day',
        department: 'Akutmottagning',
        employee_id: employeeId,
        is_published: false // UNPUBLISHED
      },
      {
        id: uuidv4(),
        date: date.toISOString().split('T')[0],
        start_time: `${date.toISOString().split('T')[0]}T22:00:00+00:00`,
        end_time: `${new Date(date.getTime() + 24*60*60*1000).toISOString().split('T')[0]}T06:00:00+00:00`,
        shift_type: 'night',
        department: 'Akutmottagning',
        employee_id: employeeId,
        is_published: false // UNPUBLISHED
      }
    ];
  }).flat()
];

console.log(`📊 Creating ${testShifts.length} test shifts...`);
console.log(`  📈 Published shifts: ${testShifts.filter(s => s.is_published).length}`);
console.log(`  📝 Unpublished shifts: ${testShifts.filter(s => !s.is_published).length}`);

const { error } = await supabase.from('shifts').insert(testShifts);

if (error) {
  console.error('❌ Error creating test shifts:', error);
} else {
  console.log('✅ Test schedule created successfully!');
  console.log('🎯 You can now test the UX differences:');
  console.log('  • Published shifts (July 1-15) should have green indicators');
  console.log('  • Unpublished shifts (July 16-31) should have dashed borders and amber styling');
  console.log('  • "Rensa schema" should be disabled since there are published shifts');
  console.log('  • You need to "Avpublicera" first to enable "Rensa schema"');
}
