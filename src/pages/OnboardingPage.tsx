import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    console.log("🧭 OnboardingPage mounted — verifying user session…");

    // 1️⃣ Immediate check on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        console.log("✅ Session already active:", data.session.user.email);
        navigate("/network", { replace: true });
      } else {
        console.warn("⚠️ No active user yet — waiting for auth event…");
      }
      setChecking(false);
    });

    // 2️⃣ Persistent listener for delayed hydration
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🧩 Auth state changed:", event);

      if (session?.user) {
        console.log("✅ Authenticated user:", session.user.email);
        navigate("/network", { replace: true });
        return;
      }

      // 🩹 SAFARI + GH PAGES FIX:
      // INITIAL_SESSION sometimes fires before Supabase restores user in localStorage.
      if (event === "INITIAL_SESSION" && !session?.user) {
        console.warn("⚠️ No user in INITIAL_SESSION — checking manually…");
        const { data: userResult, error } = await supabase.auth.getUser();

        if (error) {
          console.error("❌ getUser() error:", error.message);
          return;
        }

        if (userResult?.user) {
          console.log("✅ getUser() recovered:", userResult.user.email);
          navigate("/network", { replace: true });
          return;
        }

        console.warn("🚫 Still no user after getUser() check");
      }

      if (event === "SIGNED_OUT") {
        console.warn("👋 Signed out — redirecting to /login");
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // 3️⃣ Simple loader while verifying session
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading session...</p>
      </div>
    );
  }

  // 4️⃣ Default welcome screen
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
