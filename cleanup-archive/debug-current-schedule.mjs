import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 Analyzing weekend fairness and missing shifts...');

// Get all shifts from July 2025
const { data: shifts, error } = await supabase
  .from('shifts')
  .select(`
    date,
    shift_type,
    start_time,
    end_time,
    profiles:employees!shifts_employee_id_fkey (
      id,
      first_name,
      last_name
    )
  `)
  .gte('date', '2025-07-01')
  .lte('date', '2025-07-31')
  .order('date', { ascending: true })
  .order('start_time', { ascending: true });

if (error) {
  console.error('❌ Error fetching shifts:', error);
} else {
  console.log(`\n📊 Found ${shifts.length} shifts for July 2025`);
  
  // Analyze weekend shifts
  const weekendShifts = shifts.filter(shift => {
    const date = new Date(shift.date);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  });
  
  console.log(`\n🎯 Weekend shifts analysis (${weekendShifts.length} total weekend shifts):`);
  
  const weekendCounts = {};
  weekendShifts.forEach(shift => {
    const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
    if (!weekendCounts[employee]) {
      weekendCounts[employee] = 0;
    }
    weekendCounts[employee]++;
  });
  
  Object.entries(weekendCounts).sort((a, b) => b[1] - a[1]).forEach(([employee, count]) => {
    console.log(`  ${employee}: ${count} helgpass`);
  });
  
  const counts = Object.values(weekendCounts);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  console.log(`\n📈 Helgpassfördelning: Min=${min}, Max=${max}, Range=${max-min}`);
  
  // Check first and last days of July
  console.log('\n🔍 Checking first and last days:');
  
  // July 1st (Tuesday)
  const july1 = shifts.filter(s => s.date === '2025-07-01');
  console.log(`\n📅 2025-07-01 (tisdag): ${july1.length} skift`);
  july1.forEach(shift => {
    const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
    console.log(`  ${shift.shift_type.toUpperCase()}: ${employee}`);
  });
  
  // July 31st (Thursday)
  const july31 = shifts.filter(s => s.date === '2025-07-31');
  console.log(`\n📅 2025-07-31 (torsdag): ${july31.length} skift`);
  july31.forEach(shift => {
    const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
    console.log(`  ${shift.shift_type.toUpperCase()}: ${employee}`);
  });
  
  // Check if night shift from June 30 exists
  const june30Night = await supabase
    .from('shifts')
    .select(`
      date,
      shift_type,
      start_time,
      end_time,
      profiles:employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('date', '2025-06-30')
    .eq('shift_type', 'night');
    
  console.log(`\n🌙 30 juni natt (före första juli-dag): ${june30Night.data?.length || 0} skift`);
  if (june30Night.data?.length > 0) {
    june30Night.data.forEach(shift => {
      const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
      console.log(`  NATT: ${shift.start_time}-${shift.end_time} → ${employee}`);
    });
  }
  
  // Check if August 1st night exists
  const aug1Night = await supabase
    .from('shifts')
    .select(`
      date,
      shift_type,
      start_time,
      end_time,
      profiles:employees!shifts_employee_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq('date', '2025-07-31')
    .eq('shift_type', 'night');
    
  console.log(`\n🌙 31 juli natt (sista juli-natt): ${aug1Night.data?.length || 0} skift`);
  if (aug1Night.data?.length > 0) {
    aug1Night.data.forEach(shift => {
      const employee = shift.profiles ? `${shift.profiles.first_name} ${shift.profiles.last_name}` : 'Ingen medarbetare';
      console.log(`  NATT: ${shift.start_time}-${shift.end_time} → ${employee}`);
    });
  }
}
