// Test för att verifiera den rättade månadslogiken
const today = new Date(); // 27 juli 2025

console.log('=== RÄTTAD MÅNADSBERÄKNING ===');
console.log('Idag:', today.toISOString());
console.log('today.getMonth():', today.getMonth(), '(0-indexerat, juli)');
console.log('today.getFullYear():', today.getFullYear());

// Ny korrigerad logik
let targetYear = today.getFullYear();
let targetMonth = today.getMonth(); // Current month (0-indexed)

console.log('Initial targetMonth (current):', targetMonth);

// Increment to next month and handle year rollover
targetMonth += 1;
if (targetMonth > 11) {
  targetYear += 1;
  targetMonth = 0; // January
}

console.log('Efter increment targetMonth:', targetMonth, '(0-indexerat)');
console.log('Månad för ISO string (targetMonth + 1):', targetMonth + 1);

// ISO strings
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isLeapYear = (targetYear % 4 === 0 && targetYear % 100 !== 0) || (targetYear % 400 === 0);
const lastDayOfTargetMonth = targetMonth === 1 && isLeapYear ? 29 : daysInMonth[targetMonth];

const startDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;
const endDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}T23:59:59.999Z`;

console.log('\n=== RESULTAT ===');
console.log('Start datum ISO:', startDateISO);
console.log('End datum ISO:', endDateISO);
console.log('Genererar schema för månad:', targetMonth + 1);

// Vilken månad är det?
const months = ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'];
console.log('Månadens namn:', months[targetMonth], `(månad ${targetMonth + 1})`);

// Testa logiken för olika datum
console.log('\n=== TEST FÖR OLIKA MÅNADER ===');
function testMonth(month) {
  const testDate = new Date(2025, month, 15); // 15e dagen i månaden
  let testTargetYear = testDate.getFullYear();
  let testTargetMonth = testDate.getMonth();
  
  testTargetMonth += 1;
  if (testTargetMonth > 11) {
    testTargetYear += 1;
    testTargetMonth = 0;
  }
  
  console.log(`${months[month]} → ${months[testTargetMonth]} (${testTargetMonth + 1})`);
}

testMonth(6); // Juli → Augusti
testMonth(7); // Augusti → September  
testMonth(11); // December → Januari
