import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

// 🧱 Error Boundary
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
        <div className="min-h-screen flex items-center justify-center text-center bg-background text-foreground">
          <div>
            <p className="text-red-400 font-bold mb-2 text-lg">
              Something went wrong while loading.
            </p>
            <button
              className="border border-gold px-3 py-1 rounded hover:bg-gold/10"
              onClick={() => window.location.reload()}
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

export default function App() {
  const { checkUser, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [routerReady, setRouterReady] = useState(false);

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");

    const init = async () => {
      await checkUser();
      setLoading(false);
    };
    init();

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

    // 🕓 Delay Router mount to ensure DOM hydration
    const timer = setTimeout(() => {
      console.log("🟢 Router ready to mount safely");
      setRouterReady(true);
    }, 400);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [checkUser, setProfile]);

  if (loading || !routerReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // ✅ Delay Routes until router is fully safe
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          {/* Root */}
          <Route path="/" element={<Login />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<Login />} />

          {/* Protected */}
          <Route path="/network" element={<HomePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}
