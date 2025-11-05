// src/pages/OnboardingPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "waiting" | "ready" | "error">("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 6;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    console.log("🧭 OnboardingPage mounted — verifying user session…");

    const checkSession = async () => {
      if (cancelled) return;
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ getSession error:", error.message);
        setStatus("error");
        return;
      }

      if (data?.session?.user) {
        console.log("✅ Session found:", data.session.user.email);
        setStatus("ready");
        navigate("/network", { replace: true });
        return;
      }

      attempts++;
      if (attempts <= maxAttempts) {
        console.log(`⏳ Waiting for Supabase session… (${attempts}/${maxAttempts})`);
        await delay(500 * attempts); // progressive backoff
        await checkSession();
      } else {
        console.warn("⚠️ Still no session after retries — listening for auth events.");
        setStatus("waiting");
      }
    };

    checkSession();

    // 🎧 Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🧩 Auth event detected:", event);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("✅ Authenticated user:", session.user.email);
        setStatus("ready");
        navigate("/network", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.warn("👋 Signed out — redirecting to /login");
        setStatus("error");
        navigate("/login", { replace: true });
      } else if (event === "INITIAL_SESSION" && !session) {
        console.log("⚠️ INITIAL_SESSION fired without user — retrying hydration.");
        checkSession();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 💫 Loading screen while waiting for session
  if (status === "checking" || status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">
          Waiting for authentication...
        </p>
      </div>
    );
  }

  // 🧱 Fallback onboarding UI (if session confirmed)
  if (status === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
        <h1 className="text-4xl font-bold text-gold mb-2">🎉 Welcome to Synapse!</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Your account has been created successfully. Let’s finish setting up your profile
          so others can connect with you.
        </p>
      </div>
    );
  }

  // ❌ Error or signed out
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
