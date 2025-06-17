import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('🚀 MittSchema starting with full functionality...');
console.log('Environment:', import.meta.env.MODE);
console.log('Development mode:', import.meta.env.DEV);
console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  // Create a fallback error display instead of throwing
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
      <div style="text-align: center;">
        <h1>Loading Error</h1>
        <p>Unable to find root element. Please refresh the page.</p>
      </div>
    </div>
  `;
} else {
  console.log('✅ Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('✅ Full React app rendered successfully');
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    // Display error instead of crashing
    rootElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h1>Application Error</h1>
          <p>Failed to load the application. Please check the console for details.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
}
