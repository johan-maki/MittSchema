#!/usr/bin/env node

/**
 * Test the ultimate ISO string fix
 */

console.log('🔧 TESTING ULTIMATE ISO STRING FIX');
console.log('='.repeat(50));

const today = new Date(2025, 6, 27); // July 27, 2025
console.log('Today:', today.toString());

// New logic
const targetYear = today.getFullYear();
const targetMonth = today.getMonth() + 1; // Next month (0-indexed)

console.log('Target year:', targetYear);
console.log('Target month (0-indexed):', targetMonth);
console.log('Target month (human):', targetMonth + 1);

// Calculate actual last day of target month
const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
console.log('Last day of target month:', lastDayOfTargetMonth);

// Construct dates as ISO strings
const startDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
const endDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;

console.log('\n📅 ISO STRING CONSTRUCTION:');
console.log('Start date ISO:', startDateISO);
console.log('End date ISO:', endDateISO);

// Create Date objects from ISO strings
const startDate = new Date(startDateISO);
const endDate = new Date(endDateISO);

console.log('\n📅 DATE OBJECT VALIDATION:');
console.log('Start date object:', startDate.toString());
console.log('Start date ISO from object:', startDate.toISOString());
console.log('Start date month:', startDate.getMonth() + 1);

console.log('\nEnd date object:', endDate.toString());
console.log('End date ISO from object:', endDate.toISOString());
console.log('End date month:', endDate.getMonth() + 1);

console.log('\n✅ VALIDATION:');
console.log('Start ISO === object.toISOString():', startDateISO === startDate.toISOString());
console.log('End ISO === object.toISOString():', endDateISO === endDate.toISOString());
console.log('Both dates in target month:', 
  startDate.getMonth() === targetMonth && endDate.getMonth() === targetMonth);

// Test clearing boundaries
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

console.log('\n🎯 WHAT GUROBI RECEIVES:');
console.log('start_date:', startDateISO);
console.log('end_date:', endDateISO);
console.log('Both are pure ISO strings, no Date object conversion!');

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
  const testLastDay = new Date(testTargetYear, testTargetMonth + 1, 0).getDate();
  
  const testStartISO = `${testTargetYear}-${String(testTargetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const testEndISO = `${testTargetYear}-${String(testTargetMonth + 1).padStart(2, '0')}-${String(testLastDay).padStart(2, '0')}T23:59:59.999Z`;
  
  console.log(`\n${name}:`);
  console.log(`  Start: ${testStartISO}`);
  console.log(`  End: ${testEndISO}`);
  console.log(`  Days in month: ${testLastDay}`);
});

console.log('\n🚀 THIS SHOULD ELIMINATE ALL DATE CONFUSION!');
