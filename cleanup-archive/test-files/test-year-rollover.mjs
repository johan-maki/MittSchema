#!/usr/bin/env node

/**
 * Test year rollover scenarios
 */

console.log('🔍 TESTING YEAR ROLLOVER SCENARIOS');
console.log('='.repeat(50));

const testCases = [
  { name: 'July → August (normal)', today: new Date(2025, 6, 27) },
  { name: 'December → January (year rollover)', today: new Date(2024, 11, 15) },
];

testCases.forEach(({ name, today }) => {
  console.log(`\n📅 Testing: ${name}`);
  console.log('Today:', today.toString());
  
  const targetYear = today.getFullYear();
  const targetMonth = today.getMonth() + 1; // Next month (0-indexed)
  
  console.log('Target year:', targetYear);
  console.log('Target month (0-indexed):', targetMonth);
  
  // Check if we need year rollover
  let actualYear = targetYear;
  let actualMonth = targetMonth;
  
  if (targetMonth > 11) {
    actualYear = targetYear + 1;
    actualMonth = 0; // January
  }
  
  console.log('Actual year after rollover check:', actualYear);
  console.log('Actual month after rollover check:', actualMonth);
  console.log('Human month:', actualMonth + 1);
  
  // Calculate last day
  const lastDay = new Date(actualYear, actualMonth + 1, 0).getDate();
  console.log('Last day of month:', lastDay);
  
  // Construct ISO strings
  const startISO = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  const endISO = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
  
  console.log('Start ISO:', startISO);
  console.log('End ISO:', endISO);
  
  // Validate
  const startDate = new Date(startISO);
  const endDate = new Date(endISO);
  
  console.log('Start date month:', startDate.getMonth() + 1);
  console.log('End date month:', endDate.getMonth() + 1);
  console.log('Valid?', startDate.getMonth() === actualMonth);
});

console.log('\n💡 CONCLUSION: We need to handle year rollover properly!');
