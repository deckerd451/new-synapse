import { createClient } from '@supabase/supabase-js';

/**
 * Initialize a single Supabase client for the application.
 *
 * Using PKCE as the default flow provides secure authentication and
 * refreshes tokens automatically. The detectSessionInUrl option
 * allows the client to parse tokens returned via query params or
 * hash fragments on page load. Persisting the session in
 * localStorage ensures that users remain logged in across refreshes
 * on static hosting providers like GitHub Pages.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-synapse-session',
  },
});

console.log('✅ Supabase client initialized:', supabase);
