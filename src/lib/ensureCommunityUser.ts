// src/lib/ensureCommunityUser.ts
import { supabase } from "@/lib/supabaseClient";

export async function ensureCommunityUser() {
  const user = (await supabase.auth.getUser()).data?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("community")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("❌ ensureCommunityUser select error:", error);
    return null;
  }

  // ✅ If no record, create one
  if (!data) {
    const { error: insertError } = await supabase.from("community").insert({
      id: user.id,
      email: user.email,
      name: user.email?.split("@")[0] || "New User",
      created_at: new Date().toISOString(),
    });
    if (insertError) console.error("❌ ensureCommunityUser insert error:", insertError);
    else console.log("🆕 Created new community profile for:", user.email);
  }

  return user;
}
