#!/usr/bin/env node

// Test the date calculations used by the frontend
const currentDate = new Date('2025-06-22'); // Today
console.log('Current date:', currentDate.toISOString());
console.log('Day of week:', currentDate.getDay()); // 0 = Sunday, 1 = Monday, etc.

// Calculate week range like the frontend does
const dayOfWeek = currentDate.getDay();
const startDate = new Date(currentDate);
startDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + 6);

console.log('\nFrontend week calculation:');
console.log('Start date:', startDate.toISOString());
console.log('End date:', endDate.toISOString());
console.log('Start date formatted:', startDate.toISOString().split('T')[0]);
console.log('End date formatted:', endDate.toISOString().split('T')[0]);

// Check if we're in the right week
console.log('\nExpected:');
console.log('Monday June 23: 2025-06-23');
console.log('Sunday June 29: 2025-06-29');
