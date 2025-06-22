// Test what dates are actually sent to backend
const today = new Date();
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1); // First day of next month
const startDate = new Date(nextMonth);
startDate.setHours(0, 0, 0, 0);

// Last day of next month
const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
endDate.setHours(23, 59, 59, 999);

console.log('Frontend calculation:');
console.log('Start Date:', startDate);
console.log('End Date:', endDate);
console.log('Start ISO:', startDate.toISOString());
console.log('End ISO:', endDate.toISOString());

// This is what gets sent to backend
const apiCall = {
  start_date: startDate.toISOString(),
  end_date: endDate.toISOString(),
  department: 'Akutmottagning',
  min_staff_per_shift: 1,
  min_experience_per_shift: 1,
  include_weekends: true,
  random_seed: Date.now()
};

console.log('\nAPI call payload:');
console.log(JSON.stringify(apiCall, null, 2));

// Parse what backend would receive
const backendStart = new Date(apiCall.start_date);
const backendEnd = new Date(apiCall.end_date);

console.log('\nBackend would parse:');
console.log('Start:', backendStart);
console.log('End:', backendEnd);

// Calculate date range like backend does
const dateRange = Math.floor((backendEnd - backendStart) / (1000 * 60 * 60 * 24)) + 1;
console.log('Days in range:', dateRange);

// Generate dates like backend
const dates = [];
for (let i = 0; i < dateRange; i++) {
  const date = new Date(backendStart);
  date.setDate(backendStart.getDate() + i);
  dates.push(date);
}

console.log(`\nGenerated ${dates.length} dates:`);
console.log('First:', dates[0].toISOString().split('T')[0]);
console.log('Last:', dates[dates.length - 1].toISOString().split('T')[0]);
console.log('Includes July 31:', dates.some(d => d.getDate() === 31 && d.getMonth() === 6)); // July is month 6
