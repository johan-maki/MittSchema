#!/usr/bin/env node

console.log('🔍 Testing July 2025 date calculation...\n');

// Test what happens when we manually set to generate July 2025
const july2025Start = new Date(2025, 6, 1); // July is month 6 (0-indexed)
july2025Start.setHours(0, 0, 0, 0);

const july2025End = new Date(2025, 6 + 1, 0); // Last day of July
july2025End.setHours(23, 59, 59, 999);

console.log('Manual July 2025 calculation:');
console.log('  Start:', july2025Start.toISOString());
console.log('  End:', july2025End.toISOString());
console.log('  Start date string:', july2025Start.toISOString().split('T')[0]);
console.log('  End date string:', july2025End.toISOString().split('T')[0]);

// Test the "next month" calculation from today (June 25, 2025)
const today = new Date('2025-06-25');
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
const startDate = new Date(nextMonth);
startDate.setHours(0, 0, 0, 0);

const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
endDate.setHours(23, 59, 59, 999);

console.log('\n"Next month" calculation from June 25, 2025:');
console.log('  Today:', today.toISOString().split('T')[0]);
console.log('  Next month start:', startDate.toISOString());
console.log('  Next month end:', endDate.toISOString());
console.log('  Start date string:', startDate.toISOString().split('T')[0]);
console.log('  End date string:', endDate.toISOString().split('T')[0]);

// Test the loop for July specifically
console.log('\nTesting loop for July 2025:');
const testStart = new Date('2025-07-01T00:00:00.000Z');
const testEnd = new Date('2025-07-31T23:59:59.999Z');
const testCurrentDay = new Date(testStart);
const testDates = [];

let loopCount = 0;
while (testCurrentDay <= testEnd && loopCount < 32) {
  const dateStr = testCurrentDay.toISOString().split('T')[0];
  testDates.push(dateStr);
  testCurrentDay.setDate(testCurrentDay.getDate() + 1);
  loopCount++;
}

console.log(`  Generated ${testDates.length} dates`);
console.log(`  First: ${testDates[0]}`);
console.log(`  Last: ${testDates[testDates.length - 1]}`);
console.log(`  Contains July 31: ${testDates.includes('2025-07-31')}`);
