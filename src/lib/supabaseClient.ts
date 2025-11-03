import { createClient } from "@supabase/supabase-js";

// ✅ Fallback to hardcoded public keys when env vars aren’t available (e.g. GitHub Pages)
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
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.warn("[ensureCommunityUser] No authenticated user found.");
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("community")
      .select("id, user_id, email, name")
      .eq("email", user.email)
      .maybeSingle();

    if (fetchError) {
      console.error("[ensureCommunityUser] Fetch error:", fetchError.message);
      return;
    }

    if (existing && existing.user_id) {
      console.log("[ensureCommunityUser] Existing valid record found ✅");
      return;
    }

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
