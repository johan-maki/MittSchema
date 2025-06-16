// Browser console commands for testing
// Copy and paste these into the browser console for manual testing

// 1. Check if employees exist
console.log('🔍 Checking employees...');
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient(
  'https://pzqwkdqbgqgpfcklhlhq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6cXdrZHFiZ3FncGZja2xobGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNzM1NjQsImV4cCI6MjA0NjY0OTU2NH0.GFQN3sI2wFY7N5A02HDUUE3aQT9oEaRIoSBECdE0wpI'
);

const { data: employees, error } = await supabase.from('employees').select('*');
console.log('📊 Employees found:', employees?.length || 0, employees);

// 2. Test the Generate button click
console.log('🧪 Testing Generate Button...');
const buttons = document.querySelectorAll('button');
let found = false;
for (let button of buttons) {
  if (button.textContent && button.textContent.includes('Generera schema')) {
    console.log('✅ Found generate button!');
    console.log('Button disabled:', button.disabled);
    console.log('Clicking button...');
    button.click();
    found = true;
    break;
  }
}
if (!found) {
  console.log('❌ Generate button not found');
  console.log('Available buttons:', Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean));
}

// 3. Check current page
console.log('📍 Current page:', window.location.pathname);
