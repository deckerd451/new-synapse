import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // 🧠 Utility: try multiple times to get a valid session
  async function getStableSession(retries = 4, delayMs = 400) {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase.auth.getSession();
      if (data.session?.user) return data.session;
      if (error) console.warn("Auth check error:", error.message);
      console.log(`⏳ Waiting for Supabase session… (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  }

  useEffect(() => {
    console.log("🧭 OnboardingPage mounted — verifying user session…");

    // 1️⃣ Try stable session first
    getStableSession().then((session) => {
      if (session?.user) {
        console.log("✅ Stable session found:", session.user.email);
        navigate("/network", { replace: true });
      } else {
        console.warn("⚠️ No stable session yet — listening for events...");
      }
      setChecking(false);
    });

    // 2️⃣ Listen for late auth events (handles delayed hydration)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🧩 Auth state changed:", event);

      if (session?.user) {
        console.log("✅ Authenticated user:", session.user.email);
        navigate("/network", { replace: true });
        return;
      }

      // 🩹 Safari/GitHub Pages fix: retry after INITIAL_SESSION with delay
      if (event === "INITIAL_SESSION" && !session?.user) {
        console.warn("⚠️ INITIAL_SESSION fired without user — retrying...");
        const delayed = await getStableSession(6, 500);
        if (delayed?.user) {
          console.log("✅ Recovered session via retry:", delayed.user.email);
          navigate("/network", { replace: true });
          return;
        }
        console.error("❌ Still no session after retries.");
        toast.warning("Please sign in again.");
      }

      if (event === "SIGNED_OUT") {
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
