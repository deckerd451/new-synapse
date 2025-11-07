// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/types";

// Environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

/**
 * Supabase client configuration for GitHub Pages + SPA routing.
 * - Persists session in localStorage so reloads keep the user logged in.
 * - Auto-refreshes tokens in the background.
 * - Allows detecting and handling password reset / magic link flows.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "supabase-session",
    autoRefreshToken: true,
    detectSessionInUrl: true, // ✅ essential for email/recovery links
  },
});

console.log("✅ Supabase client initialized:", supabase);
