// src/lib/ensureCommunityUser.ts
import { supabase } from "@/lib/supabaseClient";

export async function ensureCommunityUser() {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return null;

  // Do we already have a row?
  const { data: existing, error: selErr } = await supabase
    .from("community")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr) {
    console.error("ensureCommunityUser select error", selErr);
    return user;
  }

  if (!existing) {
    const insert = {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // optional new flag (see Step 4 SQL)
      profile_completed: false,
    };
    const { error: insErr } = await supabase.from("community").insert(insert);
    if (insErr) console.error("ensureCommunityUser insert error", insErr);
  }

  return user;
}
