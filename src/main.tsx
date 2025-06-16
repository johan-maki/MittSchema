import { createRoot } from 'react-dom/client'
import MinimalApp from './MinimalApp.tsx'
import './index.css'

console.log('🚀 MittSchema starting with minimal app...');
console.log('Environment:', import.meta.env.MODE);
console.log('Development mode:', import.meta.env.DEV);
console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
} else {
  console.log('✅ Root element found, creating React root...');
  try {
    const root = createRoot(rootElement);
    root.render(<MinimalApp />);
    console.log('✅ Minimal React app rendered successfully');
  } catch (error) {
    console.error('❌ Failed to render React app:', error);
    throw error;
  }
}
