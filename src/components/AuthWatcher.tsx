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
      // ✅ Check if Supabase already stored the session
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // 🧠 Try to recover the session from URL hash (magic link)
        const { error } = await supabase.auth.setSessionFromUrl({ storeSession: true });
        if (error) console.warn("Session exchange failed:", error.message);
      }
    } catch (err) {
      console.error("Error handling initial session:", err);
    }
  };

  // Run once on mount
  handleInitialSession();

  // Existing onAuthStateChange logic
  const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      await ensureCommunityUser();

      const cameFrom = (location.state as any)?.from ?? null;
      if (cameFrom) navigate(cameFrom, { replace: true });
      else navigate("/onboarding", { replace: true });
    }

    if (event === "SIGNED_OUT") {
      navigate("/login", { replace: true });
    }
  });

  return () => sub.subscription.unsubscribe();
}, [navigate, location]);

  return null;
}
