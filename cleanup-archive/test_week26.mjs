#!/usr/bin/env node

// Test with June 23 (Monday of week 26)
const currentDate = new Date('2025-06-23');
console.log('Current date (forced to week 26):', currentDate.toISOString());
console.log('Day of week:', currentDate.getDay()); // 1 = Monday

// Calculate week range like the frontend does
const dayOfWeek = currentDate.getDay();
const startDate = new Date(currentDate);
startDate.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + 6);

console.log('\nFrontend week calculation for week 26:');
console.log('Start date:', startDate.toISOString());
console.log('End date:', endDate.toISOString());
console.log('Start date formatted:', startDate.toISOString().split('T')[0]);
console.log('End date formatted:', endDate.toISOString().split('T')[0]);
