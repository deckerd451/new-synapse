// src/components/AuthWatcher.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export function AuthWatcher() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await ensureCommunityUser();

        // Preserve deep links back to your app, but default to onboarding check:
        const cameFrom = (location.state as any)?.from ?? null;
        if (cameFrom) {
          navigate(cameFrom, { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      }
      if (event === "SIGNED_OUT") {
        navigate("/login", { replace: true });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate, location]);

  return null;
}
