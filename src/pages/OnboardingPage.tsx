// src/pages/OnboardingPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log("🧭 OnboardingPage mounted — verifying user session…");

    // Check immediately first
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        console.log("✅ Session already active:", data.session.user.email);
        navigate("/network", { replace: true });
      } else {
        console.warn("⚠️ No active user yet — waiting for auth event…");
      }
      setChecking(false);
    });

    // Listen for Supabase auth events (works even if delayed)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🧩 Auth state changed:", event);
      if (session?.user) {
        console.log("✅ Authenticated user:", session.user.email);
        navigate("/network", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.warn("👋 Signed out — redirecting to /login");
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold text-gold mb-2">🎉 Welcome to Synapse!</h1>
      <p className="text-lg text-muted-foreground max-w-md">
        Your account has been created successfully. Let’s finish setting up your
        profile so others can connect with you.
      </p>
    </div>
  );
}
