// src/App.tsx
import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function App() {
  const navigate = useNavigate();
  const listenerRef = useRef<boolean>(false);

  useEffect(() => {
    console.log("🧠 Setting up Supabase auth listener...");

    if (!supabase) {
      console.error("❌ Supabase client not found");
      return;
    }

    // 🧹 Clean up any OAuth hash in URL
    setTimeout(() => {
      if (window.location.hash.includes("access_token")) {
        const cleanUrl = window.location.origin + window.location.pathname + "#/login";
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("🧹 OAuth hash removed from URL");
      }
    }, 300);

    // ✅ Prevent multiple listener registrations
    if (listenerRef.current) return;
    listenerRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth event detected:", event);

      try {
        if (session?.user) {
          console.log("✅ Authenticated user:", session.user.email);
          await ensureCommunityUser();

          // Wait a moment for router context to stabilize
          setTimeout(() => {
            navigate("/network", { replace: true });
          }, 500);
        } else if (event === "SIGNED_OUT") {
          console.log("👋 Signed out, returning to login");
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 300);
        }
      } catch (err) {
        console.error("⚠️ Error in auth listener:", err);
      }
    });

    return () => {
      console.log("🧹 Cleaning up Supabase listener");
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // ✅ Render routes immediately so UI mounts first
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
