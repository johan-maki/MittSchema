#!/usr/bin/env node

// Direct fix: Set Erik's preferences to exclude weekends in database

console.log('🛠️ Direct fix: Setting Erik to exclude weekends...\n');

// This would be the command to directly update Erik's preferences:
const fixErikPreferences = {
  preferred_shifts: ["day", "evening", "night"],
  max_shifts_per_week: 5,
  available_days: ["monday", "tuesday", "wednesday", "thursday", "friday"] // NO weekends!
};

console.log('🎯 Erik should have these preferences:');
console.log(JSON.stringify(fixErikPreferences, null, 2));

console.log('\n📋 To fix this manually, you could:');
console.log('1. Find Erik in the database');
console.log('2. Update his work_preferences column to:');
console.log(JSON.stringify(fixErikPreferences, null, 2));

console.log('\n🚀 Or we can create a direct SQL update script...');

// SQL that would fix Erik's preferences
const sqlFix = `
UPDATE employees 
SET work_preferences = '${JSON.stringify(fixErikPreferences)}'
WHERE first_name ILIKE '%erik%' AND last_name ILIKE '%erik%';
`;

console.log('\n💾 SQL fix:');
console.log(sqlFix);

console.log('\n🧪 Let me create a direct test instead...');
