// Clean Supabase client without mock services
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://smblztfikisrnqfjmyqj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYmx6dGZpa2lzcm5xZmpteXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY4MjgsImV4cCI6MjA1NTQwMjgyOH0.yzDHEqCpNAThHKy1hNwXEUpSfgrkSchpmPuES27j8BY";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('🔗 Supabase client initialized:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY
});
