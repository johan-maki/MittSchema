// Browser console monitoring script
// Copy and paste this in the browser console to monitor the app

// Override console methods to highlight our debug messages
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  if (args[0]?.includes('🏥') || args[0]?.includes('🔘') || args[0]?.includes('🖱️') || args[0]?.includes('🎯')) {
    originalLog.apply(console, ['%c' + args[0], 'color: #22c55e; font-weight: bold', ...args.slice(1)]);
  } else {
    originalLog.apply(console, args);
  }
};

console.error = function(...args) {
  if (args[0]?.includes('❌')) {
    originalError.apply(console, ['%c' + args[0], 'color: #ef4444; font-weight: bold', ...args.slice(1)]);
  } else {
    originalError.apply(console, args);
  }
};

console.log('🔍 Console monitoring active. Debug messages will be highlighted.');
console.log('📍 Current page:', window.location.pathname);

// Check for employees in the database (if Supabase client is available)
if (window.supabase || window._supabase) {
  console.log('📡 Checking for employees in database...');
}

// Monitor for React errors
window.addEventListener('error', (e) => {
  console.error('🚨 JavaScript Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🚨 Unhandled Promise Rejection:', e.reason);
});

console.log('✅ Monitoring setup complete. Navigate to /schedule to test the Generate button.');
