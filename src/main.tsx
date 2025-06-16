import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Block Supabase network calls in development
import './utils/networkInterceptor'

createRoot(document.getElementById("root")!).render(<App />);
