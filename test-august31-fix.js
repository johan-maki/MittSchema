// Debug script to test August 31st night shift query fix
// Run this in browser console after the fix is deployed

console.clear();
console.log("🔍 TESTING AUGUST 31ST NIGHT SHIFT QUERY FIX");
console.log("=" .repeat(50));

// This should now work with the extended query range
// Before: Query ended at 2025-08-31T21:59:59.999Z (missed night shift at 22:00)
// After: Query ends at 2025-09-01T05:59:59.999Z (captures night shift)

// Look for August 31st night shift in the UI
const august31Cell = Array.from(document.querySelectorAll('div')).find(div => {
  const dayNumber = div.querySelector('span')?.textContent?.trim();
  return dayNumber === '31';
});

if (august31Cell) {
  console.log("✅ Found August 31st cell");
  
  // Count shifts displayed
  const shiftElements = august31Cell.querySelectorAll('[class*="bg-gradient"]');
  console.log(`📊 Shifts displayed: ${shiftElements.length}`);
  
  // Look for night shift specifically
  const nightShift = Array.from(shiftElements).find(shift => {
    const icon = shift.querySelector('svg');
    return icon && (icon.classList.contains('lucide-moon') || 
                   shift.textContent?.toLowerCase().includes('natt'));
  });
  
  if (nightShift) {
    console.log("🌙 FOUND AUGUST 31ST NIGHT SHIFT!");
    console.log("Employee:", nightShift.textContent?.trim());
    console.log("✅ QUERY FIX SUCCESSFUL!");
  } else {
    console.log("❌ August 31st night shift still missing");
    console.log("Need to check if:")
    console.log("1. Query range is correctly extended");
    console.log("2. Database contains the night shift");
    console.log("3. Frontend filtering is working correctly");
  }
  
  // List all shifts for August 31st
  console.log("\n📋 All August 31st shifts:");
  shiftElements.forEach((shift, i) => {
    console.log(`  Shift ${i + 1}: ${shift.textContent?.trim()}`);
  });
  
} else {
  console.log("❌ Could not find August 31st cell");
}

console.log("\n" + "=" .repeat(50));
console.log("🎯 SUMMARY:");
console.log("- Query range extended to capture night shifts starting late in month");
console.log("- Logging reduced for better console clarity");
console.log("- Check above results to verify fix");
