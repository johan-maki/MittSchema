#!/usr/bin/env node

/**
 * 🔧 TEST AV EXTENDED CLEAR RANGE - Simulerar nya clearing-logiken
 */

console.log('🔧 TESTAR EXTENDED CLEAR RANGE\n');

// Simulera frontend calculations (27 juli 2025)
const today = new Date(); // 27 juli
let targetYear = today.getFullYear(); // 2025
let targetMonth = today.getMonth(); // 6 (juli)

// Increment to next month (augusti)
targetMonth += 1; // 7 (augusti)

const startDateISO = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;

// Calculate clear end date (september 1st)
let clearEndYear = targetYear;
let clearEndMonth = targetMonth + 1; // 8 (september)
if (clearEndMonth > 11) {
    clearEndYear += 1;
    clearEndMonth = 0;
}
const clearEndDateISO = `${clearEndYear}-${String(clearEndMonth + 1).padStart(2, '0')}-01T00:00:00.000Z`;

console.log('=== CLEARING RANGE ===');
console.log('startDateISO (from):', startDateISO);
console.log('clearEndDateISO (to, exclusive):', clearEndDateISO);

console.log('\n=== GAMLA PROBLEMATISKA SHIFTS ===');
const problematicShifts = [
    '2025-09-01T06:00:00.000Z', // Erik måndag morgon
    '2025-09-01T14:00:00.000Z', // Någon måndag eftermiddag
    '2025-09-01T22:00:00.000Z'  // Någon måndag natt
];

console.log('Shifts som tidigare INTE clearades:');
problematicShifts.forEach((shift, i) => {
    console.log(`  ${i+1}. ${shift}`);
});

console.log('\n=== CLEARING LOGIC TEST ===');
console.log('Nya logiken använder:');
console.log('  .gte("start_time", "' + startDateISO + '")');
console.log('  .lt("start_time", "' + clearEndDateISO + '")');

console.log('\nResultat för problematiska shifts:');
problematicShifts.forEach((shift, i) => {
    const shiftDate = new Date(shift);
    const startDate = new Date(startDateISO);
    const endDate = new Date(clearEndDateISO);
    
    const inRange = shiftDate >= startDate && shiftDate < endDate;
    console.log(`  ${i+1}. ${shift} → ${inRange ? '✅ CLEARED' : '❌ NOT CLEARED'}`);
});

console.log('\n=== SLUTSATS ===');
console.log('Om alla problematiska shifts visar "✅ CLEARED" så borde September-buggen vara löst!');
