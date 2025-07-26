#!/usr/bin/env node

// Debug: Check if Erik's preferences actually reach Gurobi API properly

console.log('🔍 Debugging Erik preferences issue...\n');

// The issue might be:
// 1. Employee ID mismatch between frontend and database
// 2. Preferences not saving properly in database
// 3. Gurobi API not respecting the preferences

console.log('💡 Potential issues to check:');
console.log('1. ✅ Erik\'s employee_id in database vs what\'s sent to Gurobi');
console.log('2. ✅ Work preferences format - are Saturday/Sunday properly disabled?');
console.log('3. ✅ Gurobi API response - does it respect available_days constraint?');

console.log('\n🔧 Quick fix approaches:');
console.log('A. Add console.log in scheduleGenerationService to see exact employee_preferences sent');
console.log('B. Add console.log in Gurobi API to see what preferences it receives');
console.log('C. Check if Erik\'s database ID matches what\'s being sent');

console.log('\n📋 Let me create a diagnostic patch...');

const diagnosticPatch = `
// Add this to scheduleGenerationService.ts around line 138:

console.log('🔍 DIAGNOSTIC: Employee preferences being sent to Gurobi:');
employeePreferences.forEach(pref => {
  console.log(\`👤 \${pref.employee_id}:\`);
  console.log(\`   Available days: \${pref.available_days.join(', ')}\`);
  console.log(\`   Has weekends: \${pref.available_days.includes('saturday') || pref.available_days.includes('sunday')}\`);
});

// Before the schedulerApi.generateSchedule call
console.log('📤 Full request to Gurobi:', {
  employee_preferences: employeePreferences,
  employee_count: employeePreferences.length
});
`;

console.log('\n🛠️ Diagnostic patch to add:');
console.log(diagnosticPatch);

console.log('\n🎯 Expected behavior for Erik:');
console.log('- available_days should be: ["monday", "tuesday", "wednesday", "thursday", "friday"]');
console.log('- available_days should NOT include "saturday" or "sunday"'); 
console.log('- Gurobi should return 0 weekend shifts for Erik');

console.log('\n⚡ Quick test command:');
console.log('After adding the diagnostic patch, run: npm run dev');
console.log('Then generate a schedule and check the console logs');
