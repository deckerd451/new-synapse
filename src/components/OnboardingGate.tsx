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

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;

        if (!user) {
          console.warn("🚪 No authenticated user — redirecting to login");
          navigate("/login", { replace: true });
          return;
        }

        // ✅ Fetch from community table by email
        const { data: community, error } = await supabase
          .from("community")
          .select("id, email, profile_completed, name")
          .eq("email", user.email)
          .single();

        if (error) {
          console.error("❌ Error fetching community record:", error);
          navigate("/onboarding", { replace: true });
          return;
        }

        // Store in global state for later use
        setProfile(community);

        if (community.profile_completed) {
          console.log("✅ Profile completed — showing app");
          navigate("/network", { replace: true });
        } else {
          console.log("🧩 Incomplete profile — redirecting to onboarding");
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("⚠️ Error in OnboardingGate:", err);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [navigate, setProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold mb-4" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return <>{children}</>;
}
