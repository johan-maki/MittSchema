import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebyvourlaomcwitpibdl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY'
);

console.log('🧹 Clearing existing shifts for August 2025...');

try {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .gte('date', '2025-08-01')
    .lte('date', '2025-08-31');
    
  if (error) {
    console.error('❌ Error clearing shifts:', error);
  } else {
    console.log('✅ August 2025 shifts cleared successfully!');
    console.log('🎯 Now you can generate a new schedule and Andreas should get shifts');
  }
} catch (err) {
  console.error('❌ Exception:', err.message);
}
