import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 MittSchema starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('Development mode:', import.meta.env.DEV);
console.log('Hostname:', window.location.hostname);

// Only load network interceptor in development
if (import.meta.env.DEV) {
  console.log('🔧 Loading network interceptor for development...');
  import('./utils/networkInterceptor').catch(error => {
    console.error('Failed to load network interceptor:', error);
  });
} else {
  console.log('🌐 Production mode - no network interceptor needed');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
} else {
  console.log('✅ Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('✅ React app rendered');
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    throw error;
  }
}
