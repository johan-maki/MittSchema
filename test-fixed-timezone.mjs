#!/usr/bin/env node

/**
 * Test the FIXED timezone logic to ensure it works correctly
 */

console.log('🔧 TESTING FIXED TIMEZONE LOGIC');
console.log('='.repeat(50));

// Test various scenarios with the fixed logic
const testDates = [
  { name: 'July 27, 2025', date: new Date(2025, 6, 27) },
  { name: 'December 31, 2024', date: new Date(2024, 11, 31) },
  { name: 'January 1, 2024', date: new Date(2024, 0, 1) },
  { name: 'February 29, 2024 (leap year)', date: new Date(2024, 1, 29) },
];

testDates.forEach(({ name, date: today }) => {
  console.log(`\n📅 Test: ${name}`);
  console.log('Today:', today.toString());
  
  // Apply the FIXED logic from scheduleGenerationService.ts
  const startDate = new Date(Date.UTC(
    today.getFullYear(), 
    today.getMonth() + 1, // Next month
    1, // First day
    0, 0, 0, 0 // Midnight UTC
  ));
  
  const endDate = new Date(Date.UTC(
    today.getFullYear(), 
    today.getMonth() + 2, // Month after next
    0, // Last day of previous month (so last day of target month)
    23, 59, 59, 999 // End of day UTC
  ));
  
  console.log('Start date ISO (sent to Gurobi):', startDate.toISOString());
  console.log('End date ISO (sent to Gurobi):', endDate.toISOString());
  
  // Verify what Gurobi would see
  const gurobiStartDate = new Date(startDate.toISOString());
  const gurobiEndDate = new Date(endDate.toISOString());
  
  console.log('What Gurobi parses:');
  console.log('  Start month:', gurobiStartDate.getMonth() + 1);
  console.log('  End month:', gurobiEndDate.getMonth() + 1);
  console.log('  Expected target month:', today.getMonth() + 2);
  
  // Check if correct
  const targetMonth = today.getMonth() + 2 > 12 ? 
    (today.getMonth() + 2) - 12 : 
    today.getMonth() + 2;
  const isCorrect = gurobiStartDate.getMonth() + 1 === targetMonth;
  
  console.log('  ✅ Correct month:', isCorrect ? 'YES' : '❌ NO');
  
  if (!isCorrect) {
    console.log('  🚨 PROBLEM: Still getting wrong month!');
  }
});

console.log('\n🎯 SUMMARY:');
console.log('Fixed logic uses Date.UTC() to create dates directly in UTC');
console.log('This eliminates timezone conversion issues');
console.log('Gurobi should now receive correct date ranges consistently');
