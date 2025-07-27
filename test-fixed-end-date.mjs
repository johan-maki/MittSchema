#!/usr/bin/env node

/**
 * Test the FIXED end date calculation
 */

console.log('🔧 TESTING FIXED END DATE CALCULATION');
console.log('='.repeat(50));

const today = new Date(2025, 6, 27); // July 27, 2025

// NEW FIXED LOGIC
const targetYear = today.getFullYear();
const targetMonth = today.getMonth() + 1; // Next month (0-indexed)

console.log('Input values:');
console.log('  Today:', today.toString());
console.log('  Target year:', targetYear);
console.log('  Target month (0-indexed):', targetMonth);
console.log('  Target month (human):', targetMonth + 1);

const startDate = new Date(Date.UTC(
  targetYear, 
  targetMonth, // Target month 
  1, // First day
  0, 0, 0, 0 // Midnight UTC
));

// Calculate last day of target month explicitly
const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
console.log('  Days in target month:', daysInTargetMonth);

const endDate = new Date(Date.UTC(
  targetYear, 
  targetMonth, // Same target month
  daysInTargetMonth, // Explicit last day
  23, 59, 59, 999 // End of day UTC
));

console.log('\n📅 FIXED CALCULATION RESULTS:');
console.log('Start date:');
console.log('  ISO:', startDate.toISOString());
console.log('  Month (0-indexed):', startDate.getMonth());
console.log('  Month (human):', startDate.getMonth() + 1);
console.log('  Day:', startDate.getDate());

console.log('\nEnd date:');
console.log('  ISO:', endDate.toISOString());
console.log('  Month (0-indexed):', endDate.getMonth());
console.log('  Month (human):', endDate.getMonth() + 1);
console.log('  Day:', endDate.getDate());

console.log('\n✅ VALIDATION:');
console.log('Start date month === Target month?', startDate.getMonth() === targetMonth);
console.log('End date month === Target month?', endDate.getMonth() === targetMonth);
console.log('Both dates in same month?', startDate.getMonth() === endDate.getMonth());

// Test the clearing boundaries
const testDates = [
  '2025-07-31T22:00:00.000Z', // July 31 night shift
  '2025-08-01T00:00:00.000Z', // August 1 day shift
  '2025-08-01T22:00:00.000Z', // August 1 night shift
  '2025-08-31T22:00:00.000Z', // August 31 night shift
  '2025-09-01T00:00:00.000Z', // September 1 day shift
  '2025-09-01T22:00:00.000Z', // September 1 night shift
];

console.log('\n📊 CLEARING BOUNDARIES TEST:');
testDates.forEach(testDate => {
  const testDateTime = new Date(testDate).getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const wouldBeCleared = testDateTime >= startTime && testDateTime <= endTime;
  console.log(`${testDate}: ${wouldBeCleared ? '✅ CLEARED' : '❌ NOT CLEARED'}`);
});

console.log('\n🎯 EXPECTED OUTCOME:');
console.log('✅ Only August dates should be cleared');
console.log('✅ Both start and end Date objects should show August month');
console.log('✅ No confusion about September dates');

// Test edge cases
console.log('\n📊 EDGE CASE TESTS:');
const edgeCases = [
  { name: 'December → January', today: new Date(2024, 11, 15) },
  { name: 'January → February', today: new Date(2024, 0, 15) },
  { name: 'February → March (leap year)', today: new Date(2024, 1, 15) },
];

edgeCases.forEach(({ name, today: testToday }) => {
  const testTargetYear = testToday.getFullYear();
  const testTargetMonth = testToday.getMonth() + 1;
  
  const testStartDate = new Date(Date.UTC(testTargetYear, testTargetMonth, 1, 0, 0, 0, 0));
  const testDaysInMonth = new Date(testTargetYear, testTargetMonth + 1, 0).getDate();
  const testEndDate = new Date(Date.UTC(testTargetYear, testTargetMonth, testDaysInMonth, 23, 59, 59, 999));
  
  console.log(`\n${name}:`);
  console.log(`  Start: ${testStartDate.toISOString()} (month: ${testStartDate.getMonth() + 1})`);
  console.log(`  End: ${testEndDate.toISOString()} (month: ${testEndDate.getMonth() + 1})`);
  console.log(`  Same month: ${testStartDate.getMonth() === testEndDate.getMonth()}`);
});

console.log('\n🚀 READY TO DEPLOY THE FIXED CALCULATION!');
