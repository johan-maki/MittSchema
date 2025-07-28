// Test script to verify August 31st night shift query fix
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns';

console.log('🔍 TESTING AUGUST 31ST NIGHT SHIFT QUERY FIX');

// Simulate the same logic as useShiftData.ts
const currentDate = new Date('2025-08-28'); // August 28, 2025
const startDate = startOfMonth(currentDate);
let endDate = endOfMonth(currentDate);

console.log('\n📅 ORIGINAL MONTH BOUNDARIES:');
console.log(`  Start: ${format(startDate, 'yyyy-MM-dd HH:mm:ss')} (${startDate.toISOString()})`);
console.log(`  End:   ${format(endDate, 'yyyy-MM-dd HH:mm:ss')} (${endDate.toISOString()})`);

// Apply our fix
const originalEndDate = new Date(endDate);
endDate = new Date(endDate);
endDate.setHours(23, 59, 59, 999);
endDate = addDays(endDate, 1); // Include next day's early hours for night shifts
endDate.setHours(5, 59, 59, 999); // Capture until 06:00 next day

console.log('\n🔧 AFTER AUGUST 31ST NIGHT SHIFT FIX:');
console.log(`  Original End: ${format(originalEndDate, 'yyyy-MM-dd HH:mm:ss')} (${originalEndDate.toISOString()})`);
console.log(`  Extended End: ${format(endDate, 'yyyy-MM-dd HH:mm:ss')} (${endDate.toISOString()})`);

// Test if August 31st night shift would be captured
const august31NightStart = new Date('2025-08-31T22:00:00Z');
const august31NightStartISO = august31NightStart.toISOString();
const startDateISO = startDate.toISOString();
const endDateISO = endDate.toISOString();

console.log('\n🌙 AUGUST 31ST NIGHT SHIFT TEST:');
console.log(`  Night shift starts: ${august31NightStartISO}`);
console.log(`  Query start_time >= '${startDateISO}': ${august31NightStartISO >= startDateISO}`);
console.log(`  Query start_time <= '${endDateISO}': ${august31NightStartISO <= endDateISO}`);

const wouldBeCaptured = august31NightStartISO >= startDateISO && august31NightStartISO <= endDateISO;
console.log(`  ✅ Would be captured: ${wouldBeCaptured}`);

if (wouldBeCaptured) {
  console.log('\n🎉 SUCCESS: August 31st night shift will be retrieved!');
} else {
  console.log('\n🚨 FAILED: August 31st night shift will still be missing!');
}
