import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase env vars:", { supabaseUrl, supabaseAnonKey });
  throw new Error("Supabase URL and Anon Key must be defined in .env file");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

console.log("✅ Supabase client initialized:", supabase);
