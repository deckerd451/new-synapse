// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Force local storage persistence to survive GitHub Pages reloads
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    storageKey: "supabase-session", // stable key
    autoRefreshToken: true,
  },
});

console.log("✅ Supabase client initialized:", supabase);
