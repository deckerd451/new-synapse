// src/pages/OnboardingPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function OnboardingPage() {
  useAuthGuard(true); // 🔐 Require login for this page

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gold mb-4">Onboarding</h1>
      <p className="text-muted-foreground">
        Welcome! Let’s complete your profile setup.
      </p>
    </div>
  );
}


export default function OnboardingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "waiting" | "ready" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    console.log("🧭 OnboardingPage mounted — verifying user session…");

    const verifySession = async () => {
      if (cancelled) return;

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ getSession error:", error.message);
        setStatus("error");
        return;
      }

      // ✅ Found session in memory
      if (data?.session?.user) {
        console.log("✅ Session found:", data.session.user.email);
        setStatus("ready");
        navigate("/network", { replace: true });
        return;
      }

      // 🧩 Fallback: Try direct getUser (bypasses localStorage lag)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user) {
        console.log("🧩 Session restored via getUser:", userData.user.email);
        setStatus("ready");
        navigate("/network", { replace: true });
        return;
      }

      attempts++;
      if (attempts <= maxAttempts) {
        console.warn(`⏳ Waiting for Supabase session… (${attempts}/${maxAttempts})`);
        await delay(700 * attempts); // exponential backoff
        await verifySession();
      } else {
        console.error("❌ No session detected after retries.");
        setStatus("error");
      }
    };

    verifySession();

    // 🎧 Auth state listener (handles async hydration)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🧩 Auth event detected:", event);

      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        console.log("✅ Authenticated via event:", session.user.email);
        setStatus("ready");
        navigate("/network", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.warn("👋 Signed out — redirecting to login.");
        setStatus("error");
        navigate("/login", { replace: true });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 🌀 Loading state
  if (status === "checking" || status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // ✅ Displayed only briefly before redirect
  if (status === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
        <h1 className="text-4xl font-bold text-gold mb-2">Welcome to Synapse!</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Your account has been created successfully. Let’s finish setting up your profile
          so others can connect with you.
        </p>
      </div>
    );
  }

  // 🚫 Error state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold text-red-400 mb-2">Session Expired</h1>
      <p className="text-muted-foreground mb-4">Please sign in again to continue.</p>
      <button
        onClick={() => navigate("/login")}
        className="px-4 py-2 bg-gold text-black rounded-lg font-semibold hover:bg-gold/90 transition"
      >
        Return to Login
      </button>
    </div>
  );
}
