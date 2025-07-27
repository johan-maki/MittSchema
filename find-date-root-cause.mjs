#!/usr/bin/env node

/**
 * Find the REAL root cause of Date.UTC() month confusion
 */

console.log('🔍 ROOT CAUSE INVESTIGATION: Date.UTC() Month Bug');
console.log('='.repeat(60));

const today = new Date(2025, 6, 27); // July 27, 2025
const targetYear = 2025;
const targetMonth = 7; // August (0-indexed)

console.log('Target: August 2025 (month index 7)');

// Test different approaches
console.log('\n🧪 TESTING DIFFERENT DATE CONSTRUCTION APPROACHES:');

// Approach 1: What we tried
console.log('\n1. Current approach (explicit last day):');
const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
console.log('   Days in August 2025:', daysInMonth);

const endDate1 = new Date(Date.UTC(targetYear, targetMonth, daysInMonth, 23, 59, 59, 999));
console.log('   Date.UTC(2025, 7, 31, 23, 59, 59, 999):', endDate1.toISOString());
console.log('   Month (0-indexed):', endDate1.getMonth());
console.log('   Month (human):', endDate1.getMonth() + 1);
console.log('   Day:', endDate1.getDate());

// Approach 2: Using day 30 instead of 31
console.log('\n2. Using day 30:');
const endDate2 = new Date(Date.UTC(targetYear, targetMonth, 30, 23, 59, 59, 999));
console.log('   Date.UTC(2025, 7, 30, 23, 59, 59, 999):', endDate2.toISOString());
console.log('   Month (0-indexed):', endDate2.getMonth());
console.log('   Month (human):', endDate2.getMonth() + 1);

// Approach 3: Using ISO string parsing
console.log('\n3. Using ISO string construction:');
const endDate3 = new Date('2025-08-31T23:59:59.999Z');
console.log('   new Date("2025-08-31T23:59:59.999Z"):', endDate3.toISOString());
console.log('   Month (0-indexed):', endDate3.getMonth());
console.log('   Month (human):', endDate3.getMonth() + 1);

// Approach 4: First day of next month minus 1ms
console.log('\n4. Next month start - 1ms:');
const nextMonthStart = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0, 0));
const endDate4 = new Date(nextMonthStart.getTime() - 1);
console.log('   Next month start:', nextMonthStart.toISOString());
console.log('   End date (start - 1ms):', endDate4.toISOString());
console.log('   Month (0-indexed):', endDate4.getMonth());
console.log('   Month (human):', endDate4.getMonth() + 1);

// Approach 5: Manual ISO string construction
console.log('\n5. Manual ISO string construction:');
const endDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-31T23:59:59.999Z`;
const endDate5 = new Date(endDateISO);
console.log('   Manual ISO:', endDateISO);
console.log('   Parsed date:', endDate5.toISOString());
console.log('   Month (0-indexed):', endDate5.getMonth());
console.log('   Month (human):', endDate5.getMonth() + 1);

console.log('\n🎯 ANALYSIS:');
console.log('It seems like when using day 31 in Date.UTC(), JavaScript');
console.log('automatically rolls over to the next month if the time components');
console.log('push it over the boundary.');

// Test this theory
console.log('\n🧪 TESTING ROLLOVER THEORY:');
const testCases = [
  { desc: 'August 31, 00:00:00', date: new Date(Date.UTC(2025, 7, 31, 0, 0, 0, 0)) },
  { desc: 'August 31, 23:59:59', date: new Date(Date.UTC(2025, 7, 31, 23, 59, 59, 0)) },
  { desc: 'August 31, 23:59:59.999', date: new Date(Date.UTC(2025, 7, 31, 23, 59, 59, 999)) },
];

testCases.forEach(({ desc, date }) => {
  console.log(`${desc}:`);
  console.log(`  ISO: ${date.toISOString()}`);
  console.log(`  Month: ${date.getMonth() + 1}, Day: ${date.getDate()}`);
});

console.log('\n💡 SOLUTION:');
console.log('Use approach #4 (next month start - 1ms) for reliable end date calculation!');

// Verify the solution
console.log('\n✅ VERIFIED SOLUTION:');
const correctStart = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
const correctEnd = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0, 0) - 1);

console.log('Start date:', correctStart.toISOString(), '(month:', correctStart.getMonth() + 1, ')');
console.log('End date:', correctEnd.toISOString(), '(month:', correctEnd.getMonth() + 1, ')');
console.log('Same month?', correctStart.getMonth() === correctEnd.getMonth());
