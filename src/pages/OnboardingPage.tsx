// src/pages/OnboardingPage.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🧠 On mount: confirm Supabase user and ensure profile exists
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.warn("⚠️ No Supabase user found, redirecting to login...");
          navigate("/login", { replace: true });
          return;
        }

        await ensureCommunityUser(); // ✅ creates record if missing
        console.log("🧩 ensureCommunityUser completed for:", user.email);
      } catch (err: any) {
        console.error("❌ Error in onboarding init:", err);
        setError("Something went wrong while creating your profile.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleContinue = () => {
    navigate("/network?tab=profile", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <p>Setting up your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center text-foreground px-6">
        <h1 className="text-2xl font-bold text-gold mb-2">⚠️ Setup Error</h1>
        <p className="mb-6">{error}</p>
        <Button onClick={() => navigate("/login", { replace: true })}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold text-gold mb-4">🎉 Welcome to Synapse!</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Your account has been created successfully.
        Let’s finish setting up your profile so others can connect with you.
      </p>
      <Button
        className="bg-gold text-background font-bold hover:bg-gold/90 transition-all"
        onClick={handleContinue}
      >
        Continue to Profile
      </Button>
    </div>
  );
}
