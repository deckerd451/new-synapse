import { supabase } from "@/lib/supabase";

/**
 * 🧩 Ensures that the authenticated user has a corresponding row
 * in the "community" table.
 *
 * Creates one automatically if it doesn't exist.
 * Returns the full community record.
 */
export async function ensureCommunityUser() {
  try {
    // 🔐 Get current user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) {
      console.warn("⚠️ No authenticated user found.");
      return null;
    }

    // 🧠 Check if a community profile already exists
    const { data: existing, error: fetchError } = await supabase
      .from("community")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      console.log("✅ Found existing community profile:", existing);
      return existing;
    }

    // 🧱 Create a new record if one doesn’t exist
    const newProfile = {
      name: user.user_metadata?.full_name || user.email?.split("@")[0],
      email: user.email,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await supabase
      .from("community")
      .insert([newProfile])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("🆕 Created new community profile:", inserted);
    return inserted;
  } catch (err) {
    console.error("❌ ensureCommunityUser failed:", err);
    return null;
  }
}
