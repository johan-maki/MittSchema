import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function publishSomeShifts() {
  console.log('📢 Publishing some shifts for testing...');
  
  // Publish first 10 shifts to test the UI
  const { data: unpublishedShifts, error: fetchError } = await supabase
    .from('shifts')
    .select('id, start_time, shift_type')
    .eq('is_published', false)
    .limit(10)
    .order('start_time');
  
  if (fetchError) {
    console.error('❌ Error fetching unpublished shifts:', fetchError);
    return;
  }
  
  if (unpublishedShifts.length === 0) {
    console.log('✅ No unpublished shifts found to publish.');
    return;
  }
  
  console.log(`📊 Found ${unpublishedShifts.length} unpublished shifts to publish for testing`);
  
  // Publish these shifts
  const shiftIds = unpublishedShifts.map(shift => shift.id);
  const { data, error } = await supabase
    .from('shifts')
    .update({ is_published: true })
    .in('id', shiftIds)
    .select();
  
  if (error) {
    console.error('❌ Error publishing shifts:', error);
    return;
  }
  
  console.log(`✅ Successfully published ${data.length} shifts for testing`);
  console.log('🎯 Now you can test the "Avpublicera schema" button in the UI!');
  
  // Show which shifts were published
  console.log('\n📋 Published shifts:');
  unpublishedShifts.forEach((shift, index) => {
    console.log(`${index + 1}. ${shift.start_time} - ${shift.shift_type}`);
  });
}

publishSomeShifts().catch(console.error);
