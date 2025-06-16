import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Block Supabase network calls in development
import './utils/networkInterceptor'

console.log('🚀 MittSchema starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('Development mode:', import.meta.env.DEV);
console.log('Hostname:', window.location.hostname);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, creating React root...');
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('✅ React app rendered');
}
