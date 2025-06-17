// Clean Supabase client without mock services
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 CRITICAL DEBUG - Raw environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]',
  allEnvVars: Object.keys(import.meta.env)
});

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ MISSING ENVIRONMENT VARIABLES:', {
    SUPABASE_URL: SUPABASE_URL || 'MISSING',
    SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY ? '[SET]' : 'MISSING'
  });
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('🔗 Supabase client initialized:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  actualUrl: SUPABASE_URL,
  envVars: {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  }
});
