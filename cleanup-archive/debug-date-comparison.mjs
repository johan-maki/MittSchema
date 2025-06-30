#!/usr/bin/env node

console.log('🔍 Debugging date comparison issue...\n');

// Simulate what happens in the schedule builder
const start_date = "2025-07-01T00:00:00.000Z";
const end_date = "2025-07-31T21:59:59.999Z";

console.log('Input strings:');
console.log('  Start:', start_date);
console.log('  End:', end_date);

const start = new Date(start_date);
const end = new Date(end_date);

console.log('\nParsed Date objects:');
console.log('  Start:', start);
console.log('  End:', end);
console.log('  Start UTC string:', start.toISOString());
console.log('  End UTC string:', end.toISOString());

// Simulate the loop
const currentDay = new Date(start);
const dates = [];

console.log('\nSimulating schedule builder loop:');
let loopCount = 0;
while (currentDay <= end && loopCount < 35) { // Safety check
  const dateStr = currentDay.toISOString().split('T')[0];
  dates.push(dateStr);
  console.log(`  ${loopCount + 1}: ${dateStr} (${currentDay.toISOString()})`);
  
  // Move to next day
  currentDay.setDate(currentDay.getDate() + 1);
  loopCount++;
}

console.log('\nResults:');
console.log(`  Total dates generated: ${dates.length}`);
console.log(`  First date: ${dates[0]}`);
console.log(`  Last date: ${dates[dates.length - 1]}`);
console.log(`  Contains July 31: ${dates.includes('2025-07-31')}`);

// Check final comparison
console.log('\nFinal state:');
console.log(`  currentDay: ${currentDay.toISOString()}`);
console.log(`  end: ${end.toISOString()}`);
console.log(`  currentDay <= end: ${currentDay <= end}`);
