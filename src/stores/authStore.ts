import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { Notification } from "@shared/types";

// Type definitions for a row in the community table.  The application
// stores additional attributes on top of the user record returned from
// Supabase in order to drive UI state.
interface CommunityProfile {
  id: string;
  name: string | null;
  /**
   * The member's role within the community.  We avoid using the bare
   * identifier `role` because it is a reserved keyword in Postgres and
   * PostgREST.  The corresponding column in the database is now named
   * `user_role`.
   */
  user_role: string | null;
  image_url: string | null;
  email: string;
  created_at: string;
  // Additional optional fields used throughout the UI
  bio?: string | null;
  skills?: string | string[] | null;
  profile_completed?: boolean | null;
  user_id?: string;
  updated_at?: string;
}

// Definition of the Zustand auth store.  Alongside the authenticated
// profile and loading indicator we expose a list of connection
// notifications and a handler for accepting or declining them.  The
// notifications array is kept deliberately simple; the types are
// imported from shared/types.ts.
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

// Helper to ensure a community profile exists for the authenticated user.
// This function checks whether a row exists in the community table and
// inserts one if needed.  It returns the row or null on failure.
async function ensureCommunityUser(user: any): Promise<CommunityProfile | null> {
  // Return null early if no authenticated user
  if (!user?.id) return null;
  try {
    // Attempt to load an existing community profile for this user.  We request
    // all columns (*) rather than a specific subset to avoid 406 errors when
    // unknown columns are referenced in the query string.  If a row exists
    // return it immediately.
    const { data: existing, error: selectError } = await supabase
      .from("community")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!selectError && existing) {
      console.log(
        "✅ Loaded community profile:",
        existing.name || existing.email,
      );
      return existing as CommunityProfile;
    }
    // If selecting failed because the table definition in Supabase differs
    // from what the UI expects (e.g. missing columns), we still proceed with
    // inserting a minimal profile.  Ignore any unknown-column errors and
    // continue.
  } catch (err) {
    console.warn(
      "⚠️ Ignoring error while checking community profile:",
      err,
    );
  }
  try {
    /*
     * Upsert a minimal community row.  The `onConflict` option ensures we
     * don't violate the unique constraint on email, and `ignoreDuplicates`
     * prevents existing rows from being updated.  This approach avoids
     * repeated 409 (duplicate key) errors when multiple sign‑ins occur.
     */
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
        {
          onConflict: "email",
          ignoreDuplicates: true,
        },
      );
    if (upsertError) {
      console.warn(
        "⚠️ Ignoring error while upserting community profile:",
        upsertError,
      );
    }
    // Whether upsert succeeded or not, attempt to load the profile again.
    const { data: profile, error: fetchError } = await supabase
      .from("community")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (profile && !fetchError) {
      console.log("Created or loaded community profile:", profile.email);
      return profile as CommunityProfile;
    }
  } catch (err) {
    console.warn(
      "⚠️ Ignoring error while upserting/fetching community profile:",
      err,
    );
  }
  // As a last resort, return a minimal profile with just id, email and name.
  return {
    id: user.id,
    email: user.email,
    name: user.email?.split("@")[0] ?? null,
    // Provide a default user_role of null; the API will fall back to the
    // database default of 'Member' where appropriate.
    user_role: null,
    image_url: null,
    created_at: new Date().toISOString(),
  } as CommunityProfile;
}

// Zustand store implementation.  It exposes a handful of async actions
// which wrap Supabase authentication calls and manage the local state.
export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  notifications: [],

  setProfile: (profile) => set({ profile }),

  // Check whether a persisted session exists in Supabase.  If it does
  // we hydrate the store with the associated profile and mark loading
  // complete.  If not we clear the profile and also end the loading state.
      checkUser: async () => {
        console.log("Checking Supabase session...");
        try {
          /*
           * When Supabase redirects back from a password recovery link the URL
           * contains access_token and refresh_token query parameters.  Without
           * explicitly exchanging these tokens for a session the client will
           * remain unauthenticated which causes the UI to hang on the
           * "Authenticating your session" screen.  Detect these query
           * parameters and call setSession() to hydrate Supabase's internal
           * state.  Afterwards remove the parameters from the address bar to
           * prevent repeated calls on subsequent navigations.
           */
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            const accessToken = url.searchParams.get("access_token");
            const refreshToken = url.searchParams.get("refresh_token");
            const hasRecovery = url.searchParams.get("type") === "recovery";
            try {
              if (accessToken && refreshToken) {
                // Full session restoration (e.g. magic‑link flow)
                console.log("🔄 Restoring session from URL tokens…");
                const { error: setSessionError } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                if (setSessionError) {
                  console.error(
                    "❌ Failed to set session from URL:",
                    setSessionError,
                  );
                }
              } else if (accessToken || hasRecovery) {
                // Password recovery links may only include an access token
                console.log("🔄 Exchanging URL tokens for a session…");
                const { error: exchangeError } = await supabase.auth.getSessionFromUrl({
                  storeSession: true,
                });
                if (exchangeError) {
                  console.error(
                    "❌ Failed to exchange code for session:",
                    exchangeError,
                  );
                }
              }
            } finally {
              // Clean up any auth query parameters so we don't repeatedly parse them
              url.searchParams.delete("access_token");
              url.searchParams.delete("refresh_token");
              url.searchParams.delete("type");
              window.history.replaceState(
                {},
                document.title,
                url.pathname + url.search + url.hash,
              );
            }
          }
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

  // Sign in with an email and password.  On success we ensure a
  // corresponding community user exists and update the profile.
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

  // Create a new user account.  After sign up we also create a
  // community row for the user so their profile is available immediately.
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

  // Sign out the current user.  Regardless of success we clear the
  // profile and mark loading complete.
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

  /**
   * Accept or decline a pending connection request.  When a user
   * clicks the accept or decline buttons on the notifications popover
   * this action updates the corresponding record in Supabase and
   * removes the item from the notifications array.  A toast is
   * displayed on success or failure.
   */
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
      toast.success(
        status === "accepted"
          ? "Connection accepted!"
          : "Connection declined."
      );
    } catch (err: any) {
      console.error("Error updating connection status:", err);
      toast.error(err?.message || "Failed to update connection.");
    }
  },
}));

// Silent token refresh every 10 minutes.  This keeps the session
// alive without requiring user interaction.  If the refresh fails we
// clear the profile so the UI reflects the unauthenticated state.
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
}, 600_000); // 10 minutes
