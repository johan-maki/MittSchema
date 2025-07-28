/**
 * CLIENT-SIDE DEBUG SCRIPT FOR AUGUST 1ST NIGHT SHIFT ISSUE
 * 
 * Run this in the browser console while on mitt-schema.vercel.app
 * Make sure you're viewing August 2025 and looking at August 1st
 */

console.log('🔍 CLIENT-SIDE AUGUST 1ST DEBUGGING');
console.log('=====================================');

// 1. Check if we can find the shifts data in the React component tree
try {
  // Try to find React Fiber nodes containing shift data
  const findReactProps = (node) => {
    for (let key in node) {
      if (key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')) {
        return node[key];
      }
    }
    return null;
  };

  // Find all elements that might contain shift data
  const calendarElements = document.querySelectorAll('[data-date], .calendar-day, .day-cell');
  
  console.log(`📅 Found ${calendarElements.length} potential calendar elements`);
  
  // 2. Look for August 1st specifically
  const august1Elements = Array.from(calendarElements).filter(el => {
    const text = el.textContent || '';
    return text.includes('1') || el.dataset.date === '2025-08-01';
  });
  
  console.log(`📅 Found ${august1Elements.length} potential August 1st elements`);
  
  // 3. Check rendered shifts
  const shiftElements = document.querySelectorAll('.shift, [data-shift-id], .shift-item, [class*="shift"]');
  console.log(`👔 Found ${shiftElements.length} potential shift elements`);
  
  // 4. Look for specific employee names
  const allText = document.body.textContent;
  const hasLars = allText.includes('Lars');
  const hasMaria = allText.includes('Maria');
  const hasErik = allText.includes('Erik');
  
  console.log('👤 Employee names in DOM:');
  console.log(`   Lars: ${hasLars ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Maria: ${hasMaria ? '✅ Found' : '❌ Not found'}`);  
  console.log(`   Erik: ${hasErik ? '✅ Found' : '❌ Not found'}`);
  
  // 5. Look for shift type indicators
  const hasDay = allText.includes('dag') || allText.includes('Day');
  const hasEvening = allText.includes('kväll') || allText.includes('Evening');
  const hasNight = allText.includes('natt') || allText.includes('Night');
  
  console.log('🕐 Shift types in DOM:');
  console.log(`   Day/Dag: ${hasDay ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Evening/Kväll: ${hasEvening ? '✅ Found' : '❌ Not found'}`);
  console.log(`   Night/Natt: ${hasNight ? '✅ Found' : '❌ Not found'}`);
  
  // 6. Detailed DOM inspection for August 1st
  console.log('\n🔍 DOM INSPECTION FOR AUGUST 1ST:');
  
  // Find elements containing "1" that might be August 1st
  const dayOneElements = document.querySelectorAll('*');
  const august1Candidates = Array.from(dayOneElements).filter(el => {
    const text = el.textContent?.trim();
    return text === '1' && el.parentElement && 
           (el.parentElement.classList.toString().includes('day') || 
            el.parentElement.classList.toString().includes('calendar') ||
            el.parentElement.classList.toString().includes('cell'));
  });
  
  console.log(`📅 Found ${august1Candidates.length} potential August 1st day elements`);
  
  august1Candidates.forEach((el, i) => {
    console.log(`   ${i + 1}. Element:`, el);
    console.log(`      Parent classes:`, el.parentElement?.classList.toString());
    console.log(`      Siblings with content:`, 
      Array.from(el.parentElement?.children || [])
        .map(child => child.textContent?.trim())
        .filter(text => text && text.length > 0)
    );
  });
  
  // 7. Check for specific CSS classes that might hide elements
  const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], .hidden');
  console.log(`👻 Found ${hiddenElements.length} potentially hidden elements`);
  
  // Check if any contain Erik
  const hiddenWithErik = Array.from(hiddenElements).filter(el => 
    el.textContent?.includes('Erik')
  );
  
  if (hiddenWithErik.length > 0) {
    console.log('🚨 FOUND HIDDEN ELEMENTS CONTAINING ERIK:');
    hiddenWithErik.forEach((el, i) => {
      console.log(`   ${i + 1}.`, el);
      console.log(`      Style:`, el.style.cssText);
      console.log(`      Classes:`, el.classList.toString());
    });
  }
  
  // 8. Check for console errors
  console.log('\n🚨 CHECK FOR JAVASCRIPT ERRORS:');
  console.log('   (Look above in console for any red error messages)');
  
  // 9. Instructions for manual verification
  console.log('\n📋 MANUAL VERIFICATION STEPS:');
  console.log('1. Navigate to mitt-schema.vercel.app');
  console.log('2. Make sure you\'re viewing August 2025');
  console.log('3. Find August 1st on the calendar');
  console.log('4. Count the shifts visible on that day');
  console.log('5. Note which employee names you can see');
  console.log('6. Report back: "I can see [X] shifts on August 1st: [employee names]"');
  
} catch (error) {
  console.error('❌ Error in client-side debugging:', error);
}

// Export functions for manual testing
window.debugAugust1 = {
  findShiftElements: () => document.querySelectorAll('.shift, [data-shift-id], .shift-item, [class*="shift"]'),
  findEmployeeElements: (name) => Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent?.includes(name) && el.children.length === 0
  ),
  checkVisibility: (element) => {
    const styles = window.getComputedStyle(element);
    return {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      hidden: element.hidden
    };
  }
};

console.log('\n🛠️ Helper functions available:');
console.log('- debugAugust1.findShiftElements()');
console.log('- debugAugust1.findEmployeeElements("Erik")');
console.log('- debugAugust1.checkVisibility(element)');
