// src/lib/ensureCommunityUser.ts
import { supabase } from "@/lib/supabaseClient";

export async function ensureCommunityUser(email?: string) {
  if (!email) return null;

  try {
    // 1️⃣ Try to fetch existing user
    const { data: existing, error: fetchError } = await supabase
      .from("community")
      .select("*")
      .eq("email", email)
      .single();

    if (existing) {
      console.log("🧩 Community user already exists:", existing.email);
      return existing;
    }

    // 2️⃣ Insert new row only if none found
    if (fetchError && fetchError.code === "PGRST116") {
      const { data: created, error: insertError } = await supabase
        .from("community")
        .insert([{ email, name: "", profile_completed: false }])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("🎉 Created new community user for:", email);
      return created;
    }

    return null;
  } catch (err) {
    console.error("❌ ensureCommunityUser error:", err);
    return null;
  }
}
