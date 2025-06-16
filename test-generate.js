// Simple test to add one employee and test the button
console.log('🧪 Testing with one employee...');

// Create one test employee
window.testEmployee = {
  id: 'test-1',
  first_name: 'Test',
  last_name: 'Employee',
  role: 'Läkare',
  department: 'General',
  experience_level: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: null,
  work_preferences: null
};

// Try to click the generate button after a delay
setTimeout(() => {
  console.log('🔍 Looking for generate button...');
  const buttons = document.querySelectorAll('button');
  console.log('Found buttons:', buttons.length);
  
  for (let button of buttons) {
    if (button.textContent && button.textContent.includes('Generera schema')) {
      console.log('✅ Found generate button!');
      console.log('Button disabled:', button.disabled);
      console.log('Clicking button...');
      button.click();
      break;
    }
  }
}, 2000);

// Also check if any hooks are exposed on window for testing
console.log('Window.React:', window.React);
console.log('Available on window:', Object.keys(window).filter(k => k.includes('react') || k.includes('React')));
