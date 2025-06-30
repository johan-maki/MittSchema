import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Clear all shifts to start fresh
console.log('🗑️ Clearing all shifts to start fresh...');

const { data, error } = await supabase
  .from('shifts')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (this condition is always true)

if (error) {
  console.error('❌ Error clearing shifts:', error);
} else {
  console.log(`✅ Cleared ${data?.length || 'all'} shifts successfully`);
  console.log('🎯 Ready to generate a new, fair schedule with improved Gurobi algorithm!');
}
