import { create } from "zustand";
import { Profile, Notification, Connection, NetworkGraphData } from "@shared/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const USER_ID_STORAGE_KEY = "synapse-user-id";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  notifications: Notification[];
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string) => Promise<void>;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  handleConnectionRequest: (connection: Connection, newStatus: "accepted" | "declined") => Promise<void>;
  endorseSkill: (endorsedUserId: string, skill: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  notifications: [],

  setProfile: (profile) => set({ profile }),

  // ✉️ Magic link sign-in via Supabase
  signIn: async (email) => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success("Check your email for the login link!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
    } finally {
      set({ loading: false });
    }
  },

  // 🔍 Check current session
  checkUser: async () => {
    try {
      set({ loading: true });
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("community")
          .select("*")
          .eq("email", user.email)
          .single();

        if (profile) {
          localStorage.setItem(USER_ID_STORAGE_KEY, profile.id);
          set({ profile });
          get().fetchNotifications();
        }
      }
    } catch (error) {
      console.error("Error in checkUser:", error);
      localStorage.removeItem(USER_ID_STORAGE_KEY);
      set({ profile: null });
    } finally {
      set({ loading: false });
    }
  },

  // 🚪 Sign out
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem(USER_ID_STORAGE_KEY);
      set({ profile: null, notifications: [] });
      toast.info("You have been signed out.");
    } catch (error: any) {
      toast.error(error.message || "Sign out failed.");
    }
  },

  // 🔔 Fetch pending notifications
  fetchNotifications: async () => {
    const profile = get().profile;
    if (!profile) return;

    try {
      const { data: connections } = await supabase
        .from("connections")
        .select("*")
        .eq("to_user_id", profile.id)
        .eq("status", "pending");

      const { data: profiles } = await supabase.from("community").select("*");
      const profilesById = new Map(profiles?.map((p) => [p.id, p]) || []);

      const incomingRequests =
        connections?.map((c) => {
          const fromProfile = profilesById.get(c.from_user_id);
          return {
            ...c,
            profiles: {
              id: fromProfile?.id || "",
              name: fromProfile?.name || "Unknown",
              email: fromProfile?.email || "",
              image_url: fromProfile?.image_url || "",
            },
          } as Notification;
        }) || [];

      set({ notifications: incomingRequests });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  },

  // 🤝 Handle incoming connection requests
  handleConnectionRequest: async (connection, newStatus) => {
    try {
      await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("from_user_id", connection.from_user_id)
        .eq("to_user_id", connection.to_user_id);

      get().fetchNotifications();
    } catch (error: any) {
      console.error(`Error updating connection:`, error);
      toast.error(error.message || "Failed to update connection.");
    }
  },

  // ⭐ Endorse a skill
  endorseSkill: async (endorsedUserId, skill) => {
    const currentUser = get().profile;
    if (!currentUser) {
      toast.error("You must be logged in to endorse a skill.");
      return;
    }

    try {
      await supabase.from("endorsements").insert([
        {
          endorsed_user_id: endorsedUserId,
          endorsed_by_user_id: currentUser.id,
          skill,
        },
      ]);
      toast.success(`You endorsed ${skill}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to endorse skill.");
    }
  },
}));

useAuthStore.getState().checkUser();
