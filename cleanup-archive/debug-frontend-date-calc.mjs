// Test frontend date calculation for week 28 (7-13 July 2025)
const testDate = new Date('2025-07-10T12:00:00'); // Thursday in week 28

// Simulate the same logic as useShiftData
const dayOfWeek = testDate.getDay(); // 4 (Thursday = 4)
console.log('Input date:', testDate.toISOString());
console.log('Day of week (0=Sunday, 1=Monday...):', dayOfWeek);

// Calculate start of week (Monday)
const startDate = new Date(testDate);
startDate.setDate(testDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

// Calculate end of week (Sunday)  
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + 6);

console.log('Calculated week start (Monday):', startDate.toISOString());
console.log('Calculated week end (Sunday):', endDate.toISOString());

// Test specifically for July 7 (Monday)
const mondayJuly7 = new Date('2025-07-07T12:00:00');
const mondayDayOfWeek = mondayJuly7.getDay();
console.log('\n--- Testing Monday July 7 specifically ---');
console.log('Monday July 7 input:', mondayJuly7.toISOString());
console.log('Monday day of week:', mondayDayOfWeek);

const mondayWeekStart = new Date(mondayJuly7);
mondayWeekStart.setDate(mondayJuly7.getDate() - (mondayDayOfWeek === 0 ? 6 : mondayDayOfWeek - 1));

const mondayWeekEnd = new Date(mondayWeekStart);
mondayWeekEnd.setDate(mondayWeekStart.getDate() + 6);

console.log('Monday week start:', mondayWeekStart.toISOString());
console.log('Monday week end:', mondayWeekEnd.toISOString());

// Check if July 7 shifts would be included
const testShiftTime = '2025-07-07T06:00:00+00:00';
const testShiftDate = new Date(testShiftTime);
console.log('\nShift time:', testShiftTime);
console.log('Within range?', testShiftDate >= mondayWeekStart && testShiftDate <= mondayWeekEnd);

// Test the ISO string comparison (like in useShiftData)
const startDateStr = mondayWeekStart.toISOString();
const endDateStr = mondayWeekEnd.toISOString();
console.log('\nISO comparison:');
console.log('Start ISO:', startDateStr);
console.log('End ISO:', endDateStr);
console.log('Shift ISO:', testShiftTime);
console.log('Shift >= start:', testShiftTime >= startDateStr);
console.log('Shift <= end:', testShiftTime <= endDateStr);
