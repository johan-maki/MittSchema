import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deletePublishedShifts() {
  console.log('🗑️ Deleting all published shifts...');
  console.log('⚠️ WARNING: This will permanently delete published shifts!');
  
  // First, check how many published shifts we have
  const { data: publishedShifts, error: checkError } = await supabase
    .from('shifts')
    .select('id, start_time, shift_type')
    .eq('is_published', true);
  
  if (checkError) {
    console.error('❌ Error checking published shifts:', checkError);
    return;
  }
  
  console.log(`📊 Found ${publishedShifts.length} published shifts to delete`);
  
  if (publishedShifts.length === 0) {
    console.log('✅ No published shifts found. Nothing to delete.');
    return;
  }
  
  // Show which shifts will be deleted
  console.log('🔍 Shifts to be deleted:');
  publishedShifts.slice(0, 5).forEach((shift, index) => {
    console.log(`${index + 1}. ${shift.start_time} - ${shift.shift_type}`);
  });
  if (publishedShifts.length > 5) {
    console.log(`... and ${publishedShifts.length - 5} more shifts`);
  }
  
  // Delete all published shifts
  const { data, error } = await supabase
    .from('shifts')
    .delete()
    .eq('is_published', true)
    .select();
  
  if (error) {
    console.error('❌ Error deleting published shifts:', error);
    return;
  }
  
  console.log(`✅ Successfully deleted ${data.length} published shifts`);
  console.log('🎉 Published schedule has been completely removed!');
  
  // Verify the result
  const { data: remainingPublished, error: verifyError } = await supabase
    .from('shifts')
    .select('id')
    .eq('is_published', true);
  
  if (verifyError) {
    console.error('❌ Error verifying deletion:', verifyError);
    return;
  }
  
  console.log(`🔍 Verification: ${remainingPublished.length} published shifts remaining`);
}

deletePublishedShifts().catch(console.error);
