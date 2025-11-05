// src/App.tsx
import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth listener...");

    // 🧹 Clean OAuth hash (if present)
    setTimeout(() => {
      if (window.location.hash.includes("access_token")) {
        const cleanUrl =
          window.location.origin + window.location.pathname + "#/";
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("🧹 Cleaned Supabase OAuth hash from URL");
      }
    }, 250);

    // ✅ Only set up listener if Supabase is defined
    if (!supabase) {
      console.error("❌ Supabase client not initialized");
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      try {
        if (session?.user) {
          console.log("✅ Logged in as:", session.user.email);
          await ensureCommunityUser();

          // ⏳ Delay navigation slightly to ensure router is ready
          setTimeout(() => navigate("/network", { replace: true }), 300);
        } else if (event === "SIGNED_OUT") {
          console.log("👋 Signed out");
          setTimeout(() => navigate("/login", { replace: true }), 200);
        }
      } catch (err) {
        console.error("⚠️ Auth listener error:", err);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Network (protected via OnboardingGate) */}
      <Route
        path="/network"
        element={
          <OnboardingGate>
            <HomePage />
          </OnboardingGate>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
