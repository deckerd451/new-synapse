// src/stores/authStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";

interface AuthState {
  profile: any | null;
  loading: boolean;
  notifications: any[];
  setProfile: (profile: any | null) => void;
  signIn: (email: string) => Promise<void>;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  notifications: [],

  setProfile: (profile) => set({ profile }),

  // ✉️ Magic link sign-in (already used in Login.tsx)
  signIn: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://deckerd451.github.io/new-synapse/#/onboarding",
      },
    });
    if (error) throw error;
  },

  // ✅ Check if a user session already exists (used at startup)
  checkUser: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Error checking session:", error.message);
      set({ profile: null, loading: false });
      return;
    }

    const session = data.session;
    if (session?.user) {
      console.log("✅ Existing Supabase session:", session.user.email);
      set({ profile: session.user, loading: false });
    } else {
      console.log("🚫 No active Supabase session.");
      set({ profile: null, loading: false });
    }
  },

  // 🚪 Sign out and clear local state
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("❌ Error signing out:", error.message);
    set({ profile: null });
  },

  fetchNotifications: async () => {
    // You can implement Supabase fetch logic here later
    return [];
  },
}));
