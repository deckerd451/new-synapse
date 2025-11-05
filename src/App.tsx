// src/App.tsx
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";

export default function App() {
  useEffect(() => {
    console.log("🧠 Initializing Supabase auth listener...");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event:", event);

      if (session?.user) {
        console.log("✅ Authenticated user:", session.user.email);
        await ensureCommunityUser(session.user.email);
      } else if (event === "SIGNED_OUT") {
        console.log("👋 User signed out");
      }
    });

    return () => {
      console.log("🧹 Cleaning up Supabase listener...");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/network"
        element={
          <OnboardingGate>
            <HomePage />
          </OnboardingGate>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
