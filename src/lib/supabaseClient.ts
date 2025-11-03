import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Create client in browser-safe mode
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
      name: existing?.name || user.user_metadata?.full_name || user.email.split("@")[0],
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("community")
      .upsert(payload, { onConflict: "email" });

    if (upsertError) {
      console.error("[ensureCommunityUser] Upsert error:", upsertError.message);
    } else {
      console.log("[ensureCommunityUser] Community record ensured ✅", payload);
    }
  } catch (err: any) {
    console.error("[ensureCommunityUser] Unexpected error:", err.message);
  }
}

export default supabase;
