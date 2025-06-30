import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ebyvourlaomcwitpibdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVieXZvdXJsYW9tY3dpdHBpYmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODY4NDYsImV4cCI6MjA2NTc2Mjg0Nn0.jNK_J5mLw4DKZO8NTmXQzA5d51ugm9czzNkAEWyd4gY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublishedShifts() {
  console.log('🔍 Checking published shifts...');
  
  // Check all shifts and their published status
  const { data: allShifts, error: allError } = await supabase
    .from('shifts')
    .select('id, start_time, end_time, shift_type, is_published, employee_id')
    .order('start_time');
  
  if (allError) {
    console.error('❌ Error fetching all shifts:', allError);
    return;
  }
  
  console.log(`📊 Total shifts in database: ${allShifts.length}`);
  
  const publishedShifts = allShifts.filter(shift => shift.is_published);
  const unpublishedShifts = allShifts.filter(shift => !shift.is_published);
  
  console.log(`✅ Published shifts: ${publishedShifts.length}`);
  console.log(`📝 Unpublished shifts: ${unpublishedShifts.length}`);
  
  if (publishedShifts.length > 0) {
    console.log('\n🔍 Published shifts details:');
    publishedShifts.forEach((shift, index) => {
      console.log(`${index + 1}. ${shift.start_time} - ${shift.shift_type} (ID: ${shift.id})`);
    });
    
    // Group by date
    const shiftsByDate = {};
    publishedShifts.forEach(shift => {
      const date = shift.start_time.split('T')[0];
      if (!shiftsByDate[date]) {
        shiftsByDate[date] = [];
      }
      shiftsByDate[date].push(shift);
    });
    
    console.log('\n📅 Published shifts by date:');
    Object.keys(shiftsByDate).sort().forEach(date => {
      console.log(`${date}: ${shiftsByDate[date].length} shifts`);
    });
  }
  
  if (unpublishedShifts.length > 0) {
    console.log('\n📝 First few unpublished shifts:');
    unpublishedShifts.slice(0, 5).forEach((shift, index) => {
      console.log(`${index + 1}. ${shift.start_time} - ${shift.shift_type} (ID: ${shift.id})`);
    });
  }
}

checkPublishedShifts().catch(console.error);
