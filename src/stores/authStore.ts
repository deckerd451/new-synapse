import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { Notification } from "@shared/types";

// ---------- Types ----------
interface CommunityProfile {
  id: string;
  name: string | null;
  user_role: string | null;
  image_url: string | null;
  email: string;
  created_at: string;
  bio?: string | null;
  skills?: string | string[] | null;
  profile_completed?: boolean | null;
  user_id?: string;
  updated_at?: string;
}

interface AuthState {
  profile: CommunityProfile | null;
  loading: boolean;
  notifications: Notification[];
  setProfile: (profile: CommunityProfile | null) => void;
  checkUser: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleConnectionRequest: (
    notification: Notification,
    status: "accepted" | "declined"
  ) => Promise<void>;
}

// ---------- Helpers ----------
async function ensureCommunityUser(user: any): Promise<CommunityProfile | null> {
  if (!user?.id) return null;
  try {
    const { data: existing } = await supabase
      .from("community")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      console.log("✅ Loaded community profile:", existing.name || existing.email);
      return existing as CommunityProfile;
    }
  } catch (err) {
    console.warn("⚠️ Ignoring error while checking community profile:", err);
  }

  try {
    const { error: upsertError } = await supabase
      .from("community")
      .upsert(
        [
          {
            id: user.id,
            email: user.email,
            name: user.email?.split("@")[0] ?? null,
          },
        ],
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (upsertError) {
      console.warn("⚠️ Ignoring error while upserting community profile:", upsertError);
    }

    const { data: profile } = await supabase
      .from("community")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      console.log("Created or loaded community profile:", profile.email);
      return profile as CommunityProfile;
    }
  } catch (err) {
    console.warn("⚠️ Ignoring error while upserting/fetching community profile:", err);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.email?.split("@")[0] ?? null,
    user_role: null,
    image_url: null,
    created_at: new Date().toISOString(),
  } as CommunityProfile;
}

// ---------- Auth Store ----------
export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  notifications: [],

  setProfile: (profile) => set({ profile }),

  // ✅ Updated for Supabase v2
  checkUser: async () => {
    console.log("Checking Supabase session...");
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const accessToken = url.searchParams.get("access_token");
        const refreshToken = url.searchParams.get("refresh_token");
        const hasRecovery = url.searchParams.get("type") === "recovery";

        // --- Session restoration logic ---
        if (accessToken && refreshToken) {
          console.log("🔄 Restoring session from URL tokens…");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) console.error("❌ Failed to set session:", error.message);
        } else if (accessToken || hasRecovery) {
          console.log("🔄 Exchanging code for session…");
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) console.error("❌ Failed to exchange code:", error.message);
        }

        // --- Clean URL ---
        url.searchParams.delete("access_token");
        url.searchParams.delete("refresh_token");
        url.searchParams.delete("type");
        window.history.replaceState({}, document.title, url.pathname + url.hash);
      }

      // --- Get and store active session ---
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data.session?.user) {
        console.log("✅ Active session:", data.session.user.email);
        const profile = await ensureCommunityUser(data.session.user);
        set({ profile, loading: false });
      } else {
        console.log("No active Supabase session.");
        set({ profile: null, loading: false });
      }
    } catch (err) {
      console.error("❌ Error checking session:", err);
      set({ profile: null, loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      set({ loading: false });
      return;
    }
    const profile = await ensureCommunityUser(data.user);
    toast.success(`Welcome back, ${email}!`);
    set({ profile, loading: false });
  },

  signUp: async (email, password) => {
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

  handleConnectionRequest: async (notification, status) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status })
        .eq("id", notification.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notification.id),
      }));
      toast.success(status === "accepted" ? "Connection accepted!" : "Connection declined.");
    } catch (err: any) {
      console.error("Error updating connection status:", err);
      toast.error(err?.message || "Failed to update connection.");
    }
  },
}));

// ---------- Token Refresh ----------
setInterval(async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("⚠️ Token refresh failed:", error.message);
    useAuthStore.getState().setProfile(null);
  } else if (data.session?.user) {
    console.log("Session refreshed for:", data.session.user.email);
    const profile = await ensureCommunityUser(data.session.user);
    useAuthStore.getState().setProfile(profile);
  }
}, 600_000); // every 10 min
