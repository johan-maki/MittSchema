import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

console.log('🔍 Checking shifts in database...');

try {
  const { data, error, count } = await supabase
    .from('shifts')
    .select('*', { count: 'exact' });
    
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('📊 Total shifts in database:', count || data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('🔍 Sample shifts:');
      data.slice(0, 3).forEach(shift => {
        console.log(`  📅 ${shift.date} - ${shift.employee_name} (${shift.shift_type})`);
      });
      
      // Check for Andreas specifically
      const andreasShifts = data.filter(s => s.employee_name?.includes('Andreas'));
      console.log(`🎯 Andreas shifts: ${andreasShifts.length}`);
    }
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}
