// Test script for Generate Schedule button
// Run this in the browser console to test the button functionality

console.log('🧪 === TESTING GENERATE SCHEDULE BUTTON ===');

// Function to wait for an element to appear
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      } else {
        setTimeout(checkElement, 100);
      }
    }
    
    checkElement();
  });
}

// Function to test the Generate button
async function testGenerateButton() {
  try {
    console.log('🔍 Looking for Generate Schedule button...');
    
    // Try different possible selectors for the button
    const selectors = [
      'button:contains("Generera schema")',
      'button[title*="Optimera schema"]',
      'button:has-text("Generera schema")',
      '[data-testid="generate-button"]',
      'button:has(.lucide-wand2)',
      'button[class*="violet"]'
    ];
    
    let button = null;
    
    // Try to find the button using different selectors
    for (const selector of selectors) {
      try {
        if (selector.includes(':contains') || selector.includes(':has-text')) {
          // Use a more generic approach for text-based selectors
          const buttons = Array.from(document.querySelectorAll('button'));
          button = buttons.find(btn => btn.textContent?.includes('Generera schema'));
        } else {
          button = document.querySelector(selector);
        }
        
        if (button) {
          console.log(`✅ Found button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!button) {
      console.log('❌ Generate Schedule button not found. Available buttons:');
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach((btn, i) => {
        console.log(`  Button ${i}: "${btn.textContent?.trim()}" (classes: ${btn.className})`);
      });
      return;
    }
    
    console.log('📱 Button found:', {
      text: button.textContent?.trim(),
      disabled: button.disabled,
      className: button.className,
      title: button.title
    });
    
    if (button.disabled) {
      console.log('⚠️ Button is disabled, cannot test click');
      return;
    }
    
    console.log('🖱️ Clicking Generate Schedule button...');
    button.click();
    
    console.log('✅ Button click completed. Check for schedule generation logs above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGenerateButton();

// Also log some helpful debug info
console.log('📊 Current page info:', {
  url: window.location.href,
  title: document.title,
  readyState: document.readyState
});

// Check if we're on the right page
if (window.location.pathname === '/schedule') {
  console.log('✅ On schedule page - good for testing');
} else {
  console.log('⚠️ Not on schedule page, you might need to navigate there first');
}
