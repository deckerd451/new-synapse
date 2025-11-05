import { useEffect } from "react";
import { useNavigate, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";
import { supabase } from "@/lib/supabase";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth listener...");

    // 🧹 Clean up OAuth callback hash right away
    if (window.location.hash.includes("access_token")) {
      const url = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, url);
      console.log("🧹 Cleaned up Supabase OAuth hash from URL");
    }

    // 🔐 Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      if (session?.user) {
        console.log("✅ User logged in:", session.user.email);
        await ensureCommunityUser();

        // 🚀 Redirect authenticated users straight to the network page
        navigate("/network", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Onboarding + main network */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/network"
        element={
          <OnboardingGate>
            <HomePage />
          </OnboardingGate>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ✅ Wrap in HashRouter at the root (in main.tsx)
