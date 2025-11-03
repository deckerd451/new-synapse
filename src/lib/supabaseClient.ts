// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Use environment variables locally, fall back to public keys for GitHub Pages
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://hvmotpzhliufzomewzfl.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bW90cHpobGl1ZnpvbWV3emZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NzY2NDUsImV4cCI6MjA1ODE1MjY0NX0.foHTGZVtRjFvxzDfMf1dpp0Zw4XFfD-FPZK-zRnjc6s";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are missing!");
}

// ✅ Create client (browser-safe mode)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (...args) => fetch(...args),
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  },
});

console.log("[Supabase] Initialized:", supabaseUrl);

// 🧠 Ensure community record exists for logged-in user
export async function ensureCommunityUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Not authenticated");
  const user = authData.user;

  const { data: existing } = await supabase
    .from("community")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase.from("community").insert({
      email: user.email,
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;
  }
}


    // Check if a record exists for this user
    const { data: existing, error: fetchError } = await supabase
      .from("community")
      .select("id, user_id, email, name")
      .eq("email", user.email)
      .maybeSingle();

    if (fetchError) {
      console.error("[ensureCommunityUser] Fetch error:", fetchError.message);
      return;
    }

    // If record exists and user_id already matches, we're good
    if (existing && existing.user_id) {
      console.log("[ensureCommunityUser] Existing valid record found ✅");
      return;
    }

    // Create or repair record
    const payload = {
      id: existing?.id,
      user_id: user.id,
      email: user.email,
      name:
        existing?.name ||
        user.user_metadata?.full_name ||
        user.email.split("@")[0],
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("community")
      .upsert(payload, { onConflict: "email" });

    if (upsertError)
      console.error("[ensureCommunityUser] Upsert error:", upsertError.message);
    else console.log("[ensureCommunityUser] Community record ensured ✅", payload);
  } catch (err: any) {
    console.error("[ensureCommunityUser] Unexpected error:", err.message);
  }
}

export default supabase;
