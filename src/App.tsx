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

    // 🧹 Clean up OAuth hash after Supabase email redirect
    setTimeout(() => {
      if (window.location.hash.includes("access_token")) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("🧹 Cleaned up Supabase OAuth hash from URL");
      }
    }, 200);

    // 🔐 Auth listener for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      if (session?.user) {
        console.log("✅ Logged in:", session.user.email);
        await ensureCommunityUser();

        // 🚀 Redirect to network dashboard once logged in
        navigate("/network", { replace: true });
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Signed out");
        navigate("/login", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      {/* 🏁 Default route — redirect to login if no session */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 🔐 Login page */}
      <Route path="/login" element={<Login />} />

      {/* 🎯 Onboarding page */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* 🧠 Main network/dashboard, gated by onboarding */}
      <Route
        path="/network"
        element={
          <OnboardingGate>
            <HomePage />
          </OnboardingGate>
        }
      />

      {/* 🔁 Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
