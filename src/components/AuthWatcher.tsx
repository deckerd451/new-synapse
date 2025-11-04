// src/components/AuthWatcher.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export function AuthWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleInitialSession = async () => {
      try {
        // 👇 1️⃣ Manually detect token from hash fragment
        const hash = window.location.hash;
        if (hash.includes("access_token")) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) console.warn("Manual token set failed:", error.message);

            // ✅ Clear the hash so router loads cleanly
            window.history.replaceState({}, document.title, "/new-synapse/#/");
          }
        } else {
          // 🧠 fallback to normal stored session
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            const { error } = await supabase.auth.setSessionFromUrl({
              storeSession: true,
            });
            if (error) console.warn("Session exchange failed:", error.message);
          }
        }
      } catch (err) {
        console.error("Error handling initial session:", err);
      }
    };

    handleInitialSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await ensureCommunityUser();

        const cameFrom = (location.state as any)?.from ?? null;
        if (cameFrom) navigate(cameFrom, { replace: true });
        else navigate("/onboarding", { replace: true });
      }

      if (event === "SIGNED_OUT") navigate("/login", { replace: true });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate, location]);

  return null;
}
