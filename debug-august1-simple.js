// SIMPLE DEBUG: Focus only on August 1st and Erik
// Run this in browser console on mitt-schema.vercel.app while viewing August 2024

console.clear();
console.log("🔍 SIMPLE AUGUST 1ST DEBUG");
console.log("=" .repeat(40));

// Look specifically for the first day of the month
console.log("Looking for August 1st (day '1')...");

// Find all cells that might be August 1st
const allCells = document.querySelectorAll('div');
let august1Cell = null;

// Look for a cell that contains "1" as the day number
allCells.forEach(cell => {
  const text = cell.textContent?.trim();
  // Look for cell that has "1" but also "pass" (indicating it has shifts)
  if (text === '12 pass' || (text?.includes('1') && text?.includes('pass') && text.length < 20)) {
    console.log("Found potential August 1st cell:", text);
    august1Cell = cell;
  }
});

if (august1Cell) {
  console.log("✅ Found August 1st cell!");
  console.log("Cell content:", august1Cell.textContent);
  
  // Look for all shifts in this cell
  const shifts = august1Cell.querySelectorAll('[class*="gradient"]');
  console.log(`\nShifts found in August 1st: ${shifts.length}`);
  
  shifts.forEach((shift, i) => {
    const shiftText = shift.textContent?.trim();
    console.log(`Shift ${i + 1}: ${shiftText}`);
    
    // Check what color/type this shift is
    const classes = shift.className;
    let shiftType = "unknown";
    if (classes.includes('yellow')) shiftType = "DAY";
    if (classes.includes('rose') || classes.includes('pink')) shiftType = "EVENING"; 
    if (classes.includes('blue') || classes.includes('indigo')) shiftType = "NIGHT";
    
    console.log(`  Type: ${shiftType}`);
    console.log(`  Classes: ${classes}`);
    
    if (shiftText?.includes('Erik')) {
      console.log(`  🎯 THIS IS ERIK! Type: ${shiftType}`);
    }
  });
  
} else {
  console.log("❌ Could not find August 1st cell");
  console.log("This might mean you're not viewing August 2024");
  console.log("Make sure you're on the August 2024 calendar view");
}

console.log("\n" + "=".repeat(40));
console.log("SUMMARY:");
console.log("- Looking for Erik on August 1st");
console.log("- Checking what type of shift he has");
console.log("- Comparing to what you see visually");
