#!/usr/bin/env node

/**
 * 🔧 TEST AV FIX - Verifiera att T00:00:00.000Z löser September-buggen
 */

console.log('🔧 TESTAR FIX: T00:00:00.000Z istället för T23:59:59.999Z\n');

// === FÖRE FIX ===
console.log('=== FÖRE FIX (med T23:59:59.999Z) ===');
const beforeStartISO = '2025-08-01T00:00:00.000Z';
const beforeEndISO = '2025-08-31T23:59:59.999Z';

const beforeStartDate = new Date(beforeStartISO.replace('Z', '+00:00'));
const beforeEndDate = new Date(beforeEndISO.replace('Z', '+00:00'));

console.log('Start datum:', beforeStartDate);
console.log('Slut datum:', beforeEndDate);
console.log('Slut datum månad:', beforeEndDate.getMonth() + 1);

function createDateListJS(startDate, endDate) {
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const dateRange = Math.floor((endDateOnly - startDateOnly) / (1000 * 60 * 60 * 24)) + 1;
    
    const dates = [];
    for (let i = 0; i < dateRange; i++) {
        const date = new Date(startDateOnly);
        date.setDate(startDateOnly.getDate() + i);
        dates.push(date);
    }
    
    return dates;
}

const beforeDates = createDateListJS(beforeStartDate, beforeEndDate);
const beforeMonthCounts = {};
beforeDates.forEach(date => {
    const month = date.getMonth() + 1;
    beforeMonthCounts[month] = (beforeMonthCounts[month] || 0) + 1;
});

console.log('Månadsfördelning FÖRE fix:');
Object.entries(beforeMonthCounts).forEach(([month, count]) => {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    console.log(`  ${monthNames[month]} (${month}): ${count} dagar`);
});

// === EFTER FIX ===
console.log('\n=== EFTER FIX (med T00:00:00.000Z) ===');
const afterStartISO = '2025-08-01T00:00:00.000Z';
const afterEndISO = '2025-08-31T00:00:00.000Z';

const afterStartDate = new Date(afterStartISO.replace('Z', '+00:00'));
const afterEndDate = new Date(afterEndISO.replace('Z', '+00:00'));

console.log('Start datum:', afterStartDate);
console.log('Slut datum:', afterEndDate);
console.log('Slut datum månad:', afterEndDate.getMonth() + 1);

const afterDates = createDateListJS(afterStartDate, afterEndDate);
const afterMonthCounts = {};
afterDates.forEach(date => {
    const month = date.getMonth() + 1;
    afterMonthCounts[month] = (afterMonthCounts[month] || 0) + 1;
});

console.log('Månadsfördelning EFTER fix:');
Object.entries(afterMonthCounts).forEach(([month, count]) => {
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    console.log(`  ${monthNames[month]} (${month}): ${count} dagar`);
});

// === RESULTAT ===
console.log('\n=== 🎯 RESULTAT AV FIX ===');
const beforeHasMultipleMonths = Object.keys(beforeMonthCounts).length > 1;
const afterHasMultipleMonths = Object.keys(afterMonthCounts).length > 1;

if (beforeHasMultipleMonths && !afterHasMultipleMonths) {
    console.log('✅ SUCCESS! Fixen löser September-buggen!');
    console.log('   FÖRE: ', Object.keys(beforeMonthCounts).length, 'månader');
    console.log('   EFTER:', Object.keys(afterMonthCounts).length, 'månad');
} else if (!beforeHasMultipleMonths && !afterHasMultipleMonths) {
    console.log('ℹ️  Ingen skillnad detekterad - båda versioner genererar endast en månad');
} else {
    console.log('❌ Problem kvarstår eller nytt problem uppstått');
}
