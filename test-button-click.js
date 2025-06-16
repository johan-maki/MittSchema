// Simple test to click the generate button and see console output
console.log('🔧 Testing generate button click functionality...');

function attemptButtonClick() {
  console.log('🔍 Looking for generate button...');
  
  // Try multiple selectors to find the button
  const selectors = [
    'button:has-text("Generera schema")',
    'button[title*="Optimera"]', 
    'button:contains("Generera")',
    'button .lucide-wand2',
    '[role="button"]:has-text("Generera")'
  ];
  
  let generateButton = null;
  
  // Find button by text content
  const allButtons = document.querySelectorAll('button');
  console.log('🔍 Found', allButtons.length, 'total buttons');
  
  for (let button of allButtons) {
    console.log('🔘 Button text:', button.textContent?.trim());
    if (button.textContent && button.textContent.includes('Generera schema')) {
      generateButton = button;
      break;
    }
  }
  
  if (generateButton) {
    console.log('✅ Found generate button!');
    console.log('🔘 Button element:', generateButton);
    console.log('🔘 Button disabled:', generateButton.disabled);
    console.log('🔘 Button classList:', Array.from(generateButton.classList));
    
    // Try to click it
    console.log('🖱️ Attempting to click button...');
    generateButton.click();
    console.log('✅ Button click attempt completed');
  } else {
    console.log('❌ Generate button not found');
    console.log('🔍 Available button texts:', Array.from(allButtons).map(btn => btn.textContent?.trim()).filter(Boolean));
  }
}

// Try immediately
attemptButtonClick();

// Try again after a delay to make sure components are loaded
setTimeout(attemptButtonClick, 2000);
setTimeout(attemptButtonClick, 5000);
