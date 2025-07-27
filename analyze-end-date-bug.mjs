#!/usr/bin/env node

/**
 * Deep analysis of the end date calculation issue
 * The problem: Night shift on August 1st not assigned, but September 1st is assigned instead
 */

console.log('🔍 DEEP ANALYSIS: End Date Calculation Problem');
console.log('='.repeat(60));

// Simulate current logic from scheduleGenerationService.ts
const today = new Date(2025, 6, 27); // July 27, 2025
console.log('Today:', today.toString());
console.log('Today month (0-indexed):', today.getMonth());
console.log('Today month (human):', today.getMonth() + 1);

// Current (potentially buggy) logic
const startDate = new Date(Date.UTC(
  today.getFullYear(), 
  today.getMonth() + 1, // Next month (August = 7)
  1, // First day
  0, 0, 0, 0 // Midnight UTC
));

const endDate = new Date(Date.UTC(
  today.getFullYear(), 
  today.getMonth() + 2, // Month after next (September = 8)
  0, // Last day of previous month (so last day of August)
  23, 59, 59, 999 // End of day UTC
));

console.log('\n📅 CURRENT LOGIC ANALYSIS:');
console.log('Start date UTC:', startDate.toISOString());
console.log('Start date month:', startDate.getMonth() + 1);
console.log('Start date local:', startDate.toString());

console.log('\nEnd date UTC:', endDate.toISOString());
console.log('End date month:', endDate.getMonth() + 1);
console.log('End date local:', endDate.toString());

// Check what dates this covers
console.log('\n🎯 DATE RANGE ANALYSIS:');
console.log('Expected target month: August (8)');
console.log('Start date month:', startDate.getMonth() + 1);
console.log('End date month:', endDate.getMonth() + 1);

// Test if August 31st is included
const august31 = new Date('2025-08-31T23:59:59.999Z');
const september1 = new Date('2025-09-01T00:00:00.000Z');

console.log('\n🚨 CRITICAL DATE BOUNDARIES:');
console.log('August 31 23:59:59 UTC:', august31.toISOString());
console.log('September 1 00:00:00 UTC:', september1.toISOString());
console.log('Our end date:', endDate.toISOString());

console.log('\nIs August 31 23:59:59 <= our end date?', august31.getTime() <= endDate.getTime());
console.log('Is September 1 00:00:00 <= our end date?', september1.getTime() <= endDate.getTime());

// The issue might be in how we clear shifts
console.log('\n🧹 SHIFT CLEARING ANALYSIS:');
console.log('We clear shifts with:');
console.log('  .gte("start_time", startDate.toISOString())');
console.log('  .lte("start_time", endDate.toISOString())');
console.log('');
console.log('Start boundary:', startDate.toISOString());
console.log('End boundary:', endDate.toISOString());

// Check what this would include/exclude
const testDates = [
  '2025-07-31T22:00:00.000Z', // July 31 night shift
  '2025-08-01T00:00:00.000Z', // August 1 day shift
  '2025-08-01T22:00:00.000Z', // August 1 night shift
  '2025-08-31T22:00:00.000Z', // August 31 night shift
  '2025-09-01T00:00:00.000Z', // September 1 day shift
  '2025-09-01T22:00:00.000Z', // September 1 night shift
];

console.log('\n📊 SHIFT CLEARING TEST:');
testDates.forEach(testDate => {
  const testDateTime = new Date(testDate).getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const wouldBeCleared = testDateTime >= startTime && testDateTime <= endTime;
  console.log(`${testDate}: ${wouldBeCleared ? '✅ CLEARED' : '❌ NOT CLEARED'}`);
});

// Test alternative end date calculation
console.log('\n🔧 ALTERNATIVE END DATE CALCULATION:');
const betterEndDate = new Date(Date.UTC(
  today.getFullYear(), 
  today.getMonth() + 1, // Target month (August = 7) 
  31, // Explicit last day of August
  23, 59, 59, 999 // End of day UTC
));

console.log('Better end date:', betterEndDate.toISOString());
console.log('Better end date month:', betterEndDate.getMonth() + 1);

console.log('\n📊 BETTER SHIFT CLEARING TEST:');
testDates.forEach(testDate => {
  const testDateTime = new Date(testDate).getTime();
  const startTime = startDate.getTime();
  const endTime = betterEndDate.getTime();
  
  const wouldBeCleared = testDateTime >= startTime && testDateTime <= endTime;
  console.log(`${testDate}: ${wouldBeCleared ? '✅ CLEARED' : '❌ NOT CLEARED'}`);
});

// Month-specific approach
console.log('\n🎯 MONTH-SPECIFIC APPROACH:');
const targetYear = today.getFullYear();
const targetMonth = today.getMonth() + 1; // August = 7 (0-indexed)

const monthStartUTC = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
const monthEndUTC = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

console.log('Month-specific start:', monthStartUTC.toISOString());
console.log('Month-specific end:', monthEndUTC.toISOString());
console.log('Month-specific start month:', monthStartUTC.getMonth() + 1);
console.log('Month-specific end month:', monthEndUTC.getMonth() + 1);

console.log('\n📊 MONTH-SPECIFIC CLEARING TEST:');
testDates.forEach(testDate => {
  const testDateTime = new Date(testDate).getTime();
  const startTime = monthStartUTC.getTime();
  const endTime = monthEndUTC.getTime();
  
  const wouldBeCleared = testDateTime >= startTime && testDateTime <= endTime;
  console.log(`${testDate}: ${wouldBeCleared ? '✅ CLEARED' : '❌ NOT CLEARED'}`);
});

console.log('\n🎯 CONCLUSION:');
console.log('The issue might be that our end date calculation creates a date in the wrong month');
console.log('We should explicitly target the last day of the target month, not calculate it indirectly');
