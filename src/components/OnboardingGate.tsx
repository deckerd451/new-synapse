// src/components/OnboardingGate.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("🔍 Checking Supabase session...");

        // Wait for session to hydrate
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!session?.user) {
          console.warn("⚠️ No active user, redirecting to login");
          navigate("/login", { replace: true });
          return;
        }

        const userEmail = session.user.email!;
        console.log("✅ Authenticated user:", userEmail);

        // Fetch from community
        const { data: community, error } = await supabase
          .from("community")
          .select("id, email, name, profile_completed")
          .eq("email", userEmail)
          .single();

        if (error) {
          console.error("❌ Error fetching community:", error);
          navigate("/onboarding", { replace: true });
          return;
        }

        setProfile(community);

        if (community.profile_completed) {
          console.log("✅ Profile completed — showing /network");
          navigate("/network", { replace: true });
        } else {
          console.log("🧩 Incomplete profile — redirecting to onboarding");
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("⚠️ OnboardingGate error:", err);
        navigate("/login", { replace: true });
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    init();
  }, [navigate, setProfile]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
