// Clean Supabase client without mock services
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client when Supabase is not configured
const createMockClient = () => ({
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  }),
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
  }
});

export const supabase = (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY) 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : createMockClient();

console.log('🔗 Supabase client initialized:', {
  url: SUPABASE_URL || 'Not configured (using mock client)',
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  isReal: !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
});
