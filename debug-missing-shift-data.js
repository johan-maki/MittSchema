// FIND THE MISSING SHIFT: Check what data reaches the UI
// Run this in browser console on mitt-schema.vercel.app while viewing August 2024

console.clear();
console.log("🔍 FINDING THE MISSING SHIFT DATA");
console.log("=" .repeat(50));

// Try to access React component data
console.log("Attempting to find React data...");

// Look for React DevTools data
if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log("✅ React detected!");
} else {
  console.log("⚠️ React DevTools not available");
}

// Check if we can find any data in window object
console.log("\nLooking for shift data in global scope...");
const globalKeys = Object.keys(window).filter(key => 
  key.toLowerCase().includes('shift') || 
  key.toLowerCase().includes('data') ||
  key.toLowerCase().includes('schedule')
);

if (globalKeys.length > 0) {
  console.log("Found potential data keys:", globalKeys);
} else {
  console.log("No obvious data keys found");
}

// Look for any fetch requests or network activity
console.log("\nChecking for network requests...");
if (window.fetch.toString().includes('[native code]')) {
  console.log("Fetch is native (not intercepted)");
} else {
  console.log("Fetch might be wrapped/intercepted");
}

// Try to find components by looking for specific classes
console.log("\nLooking for calendar components...");
const calendarElements = document.querySelectorAll('[class*="calendar"], [class*="schedule"], [class*="shift"]');
console.log(`Found ${calendarElements.length} calendar-related elements`);

// Look for specific August 1st area and inspect its structure
console.log("\nDetailed August 1st structure analysis...");
const august1Div = Array.from(document.querySelectorAll('div')).find(div => 
  div.textContent?.trim() === '12 pass'
);

if (august1Div) {
  console.log("August 1st div found!");
  console.log("Parent element:", august1Div.parentElement);
  console.log("Parent classes:", august1Div.parentElement?.className);
  
  // Look at the parent container that should contain all shifts for this day
  const dayContainer = august1Div.parentElement;
  if (dayContainer) {
    console.log("\nAnalyzing day container:");
    console.log("Container HTML:", dayContainer.innerHTML);
    
    // Count actual rendered shifts
    const shiftElements = dayContainer.querySelectorAll('[class*="bg-gradient"]');
    console.log(`\nRendered shifts with gradients: ${shiftElements.length}`);
    
    shiftElements.forEach((shift, i) => {
      console.log(`Shift ${i + 1}:`);
      console.log(`  Text: "${shift.textContent?.trim()}"`);
      console.log(`  Classes: ${shift.className}`);
    });
    
    // Look for any elements that might be shifts but without gradients
    const allPossibleShifts = dayContainer.querySelectorAll('div[class*="p-2"]');
    console.log(`\nAll elements with p-2 class: ${allPossibleShifts.length}`);
    
    allPossibleShifts.forEach((element, i) => {
      const text = element.textContent?.trim();
      if (text && text.length < 50 && !text.includes('pass')) {
        console.log(`Possible shift ${i + 1}: "${text}" | Classes: ${element.className}`);
      }
    });
  }
}

// Check localStorage or sessionStorage for any cached data
console.log("\nChecking browser storage...");
try {
  const localKeys = Object.keys(localStorage).filter(key => 
    key.toLowerCase().includes('shift') || 
    key.toLowerCase().includes('schedule') ||
    key.toLowerCase().includes('august')
  );
  if (localKeys.length > 0) {
    console.log("Found localStorage keys:", localKeys);
  }
} catch(e) {
  console.log("Cannot access localStorage");
}

console.log("\n" + "=".repeat(50));
console.log("🎯 SUMMARY:");
console.log("- August 1st shows '12 pass' (only 2 shifts)");
console.log("- Database has 3 shifts: Lars (day), Maria (evening), Erik (night)");
console.log("- Erik's night shift is missing from the rendered HTML");
console.log("- This suggests a frontend filtering or rendering issue");

console.log("\n💡 NEXT STEPS:");
console.log("1. Check if data reaches frontend correctly");
console.log("2. Look for filtering logic that might exclude night shifts");
console.log("3. Check for any date/time issues affecting Erik's shift");
