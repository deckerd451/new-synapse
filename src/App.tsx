// src/App.tsx
import { useEffect } from "react";
import { Routes, Route, Navigate, HashRouter } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

export default function App() {
  const { profile, loading, setProfile, checkUser } = useAuthStore();

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");

    // 🔍 Check for an existing session at startup
    checkUser();

    // 🎧 Listen for auth events (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Supabase auth event:", event);

      if (session?.user) {
        console.log("✅ Logged in:", session.user.email);
        setProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Signed out");
        setProfile(null);
      }
    });

    return () => {
      console.log("🧹 Cleaning up Supabase listener...");
      subscription.unsubscribe();
    };
  }, [setProfile, checkUser]);

  // 🌀 Show brief loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* 🔁 Automatically redirect to Home if logged in */}
        <Route
          path="/"
          element={
            profile ? <Navigate to="/network" replace /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={profile ? <Navigate to="/network" replace /> : <Login />}
        />

        <Route
          path="/onboarding"
          element={profile ? <OnboardingPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/network"
          element={profile ? <HomePage /> : <Navigate to="/login" replace />}
        />

        {/* 🧭 Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
