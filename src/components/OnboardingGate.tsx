// src/components/OnboardingGate.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verifyProfile = async () => {
      try {
        // 🔐 1. Ensure a logged-in user exists
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.warn("⚠️ No user session found — redirecting to login.");
          navigate("/login", { replace: true });
          return;
        }

        // 🧩 2. Check if a profile exists in 'community' table
        const { data, error } = await supabase
          .from("community")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("❌ Error checking community profile:", error);
          navigate("/login", { replace: true });
          return;
        }

        if (!data) {
          console.log("🆕 No profile found — redirecting to onboarding.");
          navigate("/onboarding", { replace: true });
          return;
        }

        // ✅ 3. User is onboarded
        setAllowed(true);
      } catch (err) {
        console.error("❌ OnboardingGate failed:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    verifyProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!allowed) return null; // prevents flicker while redirecting

  return <>{children}</>;
}
