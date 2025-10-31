import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Force native browser fetch
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (...args) => fetch(...args),
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

console.log("[Supabase] Initialized in browser-safe mode");

export default supabase;
