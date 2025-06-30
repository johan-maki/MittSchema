import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function unpublishSchedule() {
  console.log('🔓 Unpublishing all published shifts...');
  
  // First, check how many published shifts we have
  const { data: publishedShifts, error: checkError } = await supabase
    .from('shifts')
    .select('id, start_time, shift_type')
    .eq('is_published', true);
  
  if (checkError) {
    console.error('❌ Error checking published shifts:', checkError);
    return;
  }
  
  console.log(`📊 Found ${publishedShifts.length} published shifts to unpublish`);
  
  if (publishedShifts.length === 0) {
    console.log('✅ No published shifts found. Nothing to unpublish.');
    return;
  }
  
  // Unpublish all published shifts
  const { data, error } = await supabase
    .from('shifts')
    .update({ is_published: false })
    .eq('is_published', true)
    .select();
  
  if (error) {
    console.error('❌ Error unpublishing shifts:', error);
    return;
  }
  
  console.log(`✅ Successfully unpublished ${data.length} shifts`);
  console.log('🎉 All shifts are now editable again!');
  
  // Verify the result
  const { data: remainingPublished, error: verifyError } = await supabase
    .from('shifts')
    .select('id')
    .eq('is_published', true);
  
  if (verifyError) {
    console.error('❌ Error verifying unpublish:', verifyError);
    return;
  }
  
  console.log(`🔍 Verification: ${remainingPublished.length} published shifts remaining`);
}

unpublishSchedule().catch(console.error);
