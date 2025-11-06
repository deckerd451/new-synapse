import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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

// 🧩 Ensure that a user exists in the community table
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

  // If the profile exists, return it
  if (existing) {
    console.log("✅ Loaded community profile:", existing.name || existing.email);
    return existing;
  }

  // Otherwise, create a new profile
  const { data: created, error: insertError } = await supabase
    .from("community")
    .insert([
      {
        id: user.id,
        email: user.email,
        name: user.email?.split("@")[0],
        role: "Member",
        image_url: null,
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

// 🧠 Zustand auth store
export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,

  setProfile: (profile) => set({ profile }),

  // 🧭 Check session and sync community profile
  checkUser: async () => {
    console.log("🔍 Checking Supabase session...");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session?.user) {
        console.log("✅ Active Supabase user:", data.session.user.email);
        const profile = await ensureCommunityUser(data.session.user);
        set({ profile, loading: false });
      } else {
        console.log("🚫 No active Supabase session.");
        set({ profile: null, loading: false });
      }
    } catch (err) {
      console.error("❌ Error checking session:", err);
      set({ profile: null, loading: false });
    }
  },

  // 🔑 Login
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
