import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzvrnwhzwczqfwqftpmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dnJud2h6d2N6cWZ3cWZ0cG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5OTYwMjYsImV4cCI6MjA1MTU3MjAyNn0.tz4WLrGlpBmTe3QWgFdPfh0DQA3mjSzQW9AZ-e6vyRE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAugust1Shifts() {
  console.log('🔍 Checking shifts for August 1, 2025...\n');
  
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      employee_id,
      start_time,
      end_time,
      shift_type,
      date,
      employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .gte('start_time', '2025-08-01T00:00:00.000Z')
    .lt('start_time', '2025-08-02T00:00:00.000Z')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('❌ Error fetching shifts:', error);
    return;
  }

  console.log(`📊 Found ${shifts?.length || 0} shifts starting on August 1, 2025`);
  
  if (shifts && shifts.length > 0) {
    shifts.forEach((shift, index) => {
      const employeeName = shift.employees ? 
        `${shift.employees.first_name} ${shift.employees.last_name}` : 
        'Unknown Employee';
      
      console.log(`${index + 1}. ${shift.shift_type.toUpperCase()} - ${employeeName}`);
    });

    const byType = shifts.reduce((acc, shift) => {
      acc[shift.shift_type] = (acc[shift.shift_type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 SHIFT TYPE BREAKDOWN:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} shift(s)`);
    });
  } else {
    console.log('❌ No shifts found for August 1, 2025');
  }
}

async function debugFrontendFiltering() {
  console.log('\n✅ August 1 shifts check completed!');
}

checkAugust1Shifts()
  .then(() => debugFrontendFiltering())
  .catch(console.error);
