import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

// 🧠 Type definitions
interface CommunityProfile {
  id: string;
  name: string | null;
  role: string | null;
  image_url: string | null;
  email: string;
  created_at: string;
}

interface AuthState {
  profile: CommunityProfile | null;
  loading: boolean;
  setProfile: (profile: CommunityProfile | null) => void;
  checkUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// 🧩 Ensure user exists in community table
async function ensureCommunityUser(user: any): Promise<CommunityProfile | null> {
  if (!user?.id) return null;

  const { data: existing, error: selectError } = await supabase
    .from("community")
    .select("*")
    .eq("id", user.id)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    console.error("❌ Error checking community user:", selectError);
    return null;
  }

  if (existing) {
    console.log("✅ Loaded community profile:", existing.name || existing.email);
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("community")
    .insert([
      {
        id: user.id,
        email: user.email,
        name: user.email?.split("@")[0],
        role: "Member",
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("❌ Error creating community profile:", insertError);
    return null;
  }

  console.log("🆕 Created new community profile:", created.email);
  return created;
}

// 🧱 Auth store with silent refresh + hydration guard
export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),

  // 🔍 Check session on startup with retry
  checkUser: async () => {
    console.log("🔍 Checking Supabase session...");
    let attempts = 0;
    while (attempts < 3) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          console.log("✅ Active session:", data.session.user.email);
          const profile = await ensureCommunityUser(data.session.user);
          set({ profile, loading: false });
          return;
        } else {
          console.log("🚫 No active session (attempt", attempts + 1, ")");
        }
      } catch (err) {
        console.error("❌ Error checking session:", err);
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 500));
    }
    set({ profile: null, loading: false });
  },

  // 🔑 Sign-in
  signIn: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      set({ loading: false });
    } else {
      const profile = await ensureCommunityUser(data.user);
      toast.success(`Welcome back, ${email}!`);
      set({ profile, loading: false });
    }
  },

  // 🧾 Sign-up
  signUp: async (email: string, password: string) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Check your email to confirm.");
      if (data.user) {
        const profile = await ensureCommunityUser(data.user);
        set({ profile });
      }
    }
    set({ loading: false });
  },

  // 👋 Sign-out
  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.info("Signed out successfully.");
    }
    set({ profile: null, loading: false });
  },
}));

// 🔁 Silent token refresh every 10 minutes
setInterval(async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("⚠️ Token refresh failed:", error.message);
    useAuthStore.getState().setProfile(null);
  } else if (data.session?.user) {
    console.log("🔄 Session refreshed for:", data.session.user.email);
    const profile = await ensureCommunityUser(data.session.user);
    useAuthStore.getState().setProfile(profile);
  }
}, 600_000); // 10 minutes
