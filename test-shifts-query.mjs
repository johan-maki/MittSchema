import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

async function testShiftsQuery() {
  console.log('Testing shifts query...');
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      profiles:employees!shifts_employee_id_fkey (
        first_name,
        last_name,
        experience_level,
        hourly_rate
      )
    `)
    .limit(3);
    
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
  
  if (data) {
    data.forEach(shift => {
      console.log(`Shift ${shift.id} profile:`, typeof shift.profiles, shift.profiles);
    });
  }
}

testShiftsQuery();
