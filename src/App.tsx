import { useEffect, useState } from "react";
import { Routes, Route, Navigate, HashRouter } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

export default function App() {
  const { profile, loading, setProfile, checkUser } = useAuthStore();
  const [ready, setReady] = useState(false); // ✅ router safety lock

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");
    checkUser();

    // 🎧 Listen for login/logout
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

    // ✅ Once Supabase has checked session, unlock router
    const timer = setTimeout(() => {
      console.log("🟢 App Ready: Router can safely mount now");
      setReady(true);
    }, 1200); // 1.2s guard ensures Supabase has fully hydrated

    return () => {
      console.log("🧹 Cleaning up Supabase listener...");
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [setProfile, checkUser]);

  // 🌀 Hold the app until both Supabase + Router are safe
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // ✅ Safe router rendering after hydration lock release
  return (
    <HashRouter>
      <Routes>
        {/* 🔁 Root redirect logic */}
        <Route
          path="/"
          element={
            profile ? <Navigate to="/network" replace /> : <Navigate to="/login" replace />
          }
        />
        {/* 🔐 Protected routes */}
        <Route
          path="/network"
          element={profile ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/onboarding"
          element={profile ? <OnboardingPage /> : <Navigate to="/login" replace />}
        />
        {/* 🔑 Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<Login />} />
        {/* 🧭 Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
