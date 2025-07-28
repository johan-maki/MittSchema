// BETTER DEBUG: Find August 1st the right way
// Run this in browser console on mitt-schema.vercel.app while viewing August 2024

console.clear();
console.log("🔍 BETTER AUGUST 1ST DEBUG");
console.log("=" .repeat(40));

// Look for the actual August 1st cell (day 1, not 31)
console.log("Looking for the REAL August 1st (day 1)...");

// Find all divs that might contain day numbers
const allDivs = document.querySelectorAll('div');
let august1Cell = null;

// Look for a cell that has exactly "1" as the day AND has shifts
allDivs.forEach(div => {
  const text = div.textContent?.trim();
  
  // Look for cells that start with "1" followed by a space and number (like "12 pass")
  // This should be August 1st with 2 shifts
  if (text === '12 pass') {
    console.log("🎯 Found August 1st cell:", text);
    august1Cell = div;
    return; // Stop looking once we find it
  }
});

if (august1Cell) {
  console.log("✅ Found August 1st cell!");
  console.log("Full cell content:", august1Cell.textContent);
  
  // Look for ANY child elements that might be shifts
  console.log("\n--- Looking for ALL child elements ---");
  const allChildren = august1Cell.querySelectorAll('*');
  console.log(`Total child elements: ${allChildren.length}`);
  
  // Look specifically for elements that contain names
  const nameElements = [];
  allChildren.forEach((child, i) => {
    const childText = child.textContent?.trim();
    if (childText && childText.length < 50) { // Short text that might be names
      // Check if it contains common name patterns
      if (childText.includes('Lars') || childText.includes('Maria') || childText.includes('Erik') || 
          childText.includes('Anna') || childText.includes('David') || childText.includes('Sara')) {
        nameElements.push({
          index: i,
          text: childText,
          classes: child.className,
          tagName: child.tagName
        });
      }
    }
  });
  
  console.log(`\nFound ${nameElements.length} elements with names:`);
  nameElements.forEach((element, i) => {
    console.log(`Name element ${i + 1}:`);
    console.log(`  Text: "${element.text}"`);
    console.log(`  Tag: ${element.tagName}`);
    console.log(`  Classes: ${element.classes}`);
    
    // Check for shift type based on colors
    let shiftType = "UNKNOWN";
    if (element.classes.includes('yellow') || element.classes.includes('amber')) shiftType = "DAY";
    if (element.classes.includes('rose') || element.classes.includes('pink')) shiftType = "EVENING";
    if (element.classes.includes('blue') || element.classes.includes('indigo')) shiftType = "NIGHT";
    
    console.log(`  Likely shift type: ${shiftType}`);
    
    if (element.text.includes('Erik')) {
      console.log(`  🎯 ERIK FOUND! Type: ${shiftType}`);
    }
    console.log(''); // Empty line
  });
  
  // Also check the direct text content
  console.log("--- Direct text analysis ---");
  const cellText = august1Cell.textContent;
  console.log("Full cell text:", cellText);
  
  if (cellText.includes('Erik')) {
    console.log("✅ Erik's name IS in the August 1st cell text!");
  } else {
    console.log("❌ Erik's name is NOT in the August 1st cell text!");
  }
  
  if (cellText.includes('Lars')) {
    console.log("✅ Lars is in the cell");
  }
  if (cellText.includes('Maria')) {
    console.log("✅ Maria is in the cell");
  }
  
} else {
  console.log("❌ Could not find August 1st cell with '12 pass'");
  
  // Let's see what cells we did find
  console.log("\nAll cells with 'pass' found:");
  allDivs.forEach(div => {
    const text = div.textContent?.trim();
    if (text && text.includes('pass') && text.length < 20) {
      console.log(`"${text}"`);
    }
  });
}

console.log("\n" + "=".repeat(40));
console.log("KEY QUESTION: Is Erik in the August 1st cell or not?");
