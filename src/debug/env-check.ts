// Debug environment variables in production
console.log('=== Environment Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('Hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
console.log('========================');

export {};
