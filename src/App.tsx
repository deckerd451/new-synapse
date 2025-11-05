// src/App.tsx
import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";
import { supabase } from "@/lib/supabase";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export default function App() {
  // ✅ Run once on mount
  useEffect(() => {
    console.log("🧠 Initializing Supabase auth listener...");

    // Listen for auth state changes (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      if (session?.user) {
        console.log("✅ User logged in:", session.user.email);
        await ensureCommunityUser(); // creates or finds community profile
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
      }
    });

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ Explicit login route */}
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

        {/* ✅ Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
