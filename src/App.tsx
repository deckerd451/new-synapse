import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

/** ────────────────────────────────
 * 🧱 Error Boundary (final version)
 * Prevents blank screen and provides reload fallback.
 * ──────────────────────────────── */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("💥 Caught error in boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground text-center">
          <div>
            <p className="text-red-400 font-bold mb-3 text-lg">
              Something went wrong while loading.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="border border-gold px-4 py-2 rounded hover:bg-gold/10 transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** ────────────────────────────────
 * 🧩 Router Component
 * Isolated so it mounts only after hydration
 * ──────────────────────────────── */
function AppRouter() {
  const { profile } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<Login />} />
      <Route
        path="/network"
        element={profile ? <HomePage /> : <Login />}
      />
      <Route
        path="/onboarding"
        element={profile ? <OnboardingPage /> : <Login />}
      />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

/** ────────────────────────────────
 * 🌐 Main App Component
 * Handles Supabase session check, then safely mounts router
 * ──────────────────────────────── */
export default function App() {
  const { checkUser, setProfile } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");
    const initAuth = async () => {
      console.log("🔍 Checking Supabase session...");
      await checkUser();
      setLoading(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Supabase auth event:", event);
        if (session?.user) {
          console.log("✅ Logged in:", session.user.email);
          setProfile(session.user);
        } else if (event === "SIGNED_OUT") {
          console.log("👋 Signed out");
          setProfile(null);
        }
      }
    );

    // Delay router mount until after hydration
    const timer = setTimeout(() => {
      console.log("🟢 React hydration complete – router safe to mount");
      setHydrated(true);
    }, 1000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [checkUser, setProfile]);

  if (loading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // ✅ Router rendered safely after hydration
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppRouter />
      </HashRouter>
    </ErrorBoundary>
  );
}
