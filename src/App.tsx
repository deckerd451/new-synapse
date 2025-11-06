import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

// 🧱 Error Boundary (global catch)
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

// 🧩 SafeRender wrapper for per-component crash tracking
function SafeRender({ children, name }: { children: React.ReactNode; name: string }) {
  try {
    return <>{children}</>;
  } catch (err) {
    console.error(`💥 Render failed in ${name}:`, err);
    return (
      <div className="text-red-400 text-center mt-20">
        <p>Component "{name}" failed to render.</p>
      </div>
    );
  }
}

export default function App() {
  const { checkUser, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [routerReady, setRouterReady] = useState(false);

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");

    const init = async () => {
      console.log("🔍 Checking Supabase session...");
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

    const timer = setTimeout(() => {
      console.log("🟢 App Ready: Router safe to mount");
      setRouterReady(true);
    }, 500);

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

  // 🧩 Full app render
  return (
    <HashRouter>
      <ErrorBoundary>
        <Routes>
          {/* Root */}
          <Route
            path="/"
            element={
              <SafeRender name="Login">
                <Login />
              </SafeRender>
            }
          />

          {/* Public */}
          <Route
            path="/login"
            element={
              <SafeRender name="Login">
                <Login />
              </SafeRender>
            }
          />
          <Route
            path="/reset-password"
            element={
              <SafeRender name="ResetPassword">
                <Login />
              </SafeRender>
            }
          />

          {/* Protected */}
          <Route
            path="/network"
            element={
              <SafeRender name="HomePage">
                <HomePage />
              </SafeRender>
            }
          />
          <Route
            path="/onboarding"
            element={
              <SafeRender name="OnboardingPage">
                <OnboardingPage />
              </SafeRender>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <SafeRender name="Fallback">
                <Login />
              </SafeRender>
            }
          />
        </Routes>
      </ErrorBoundary>
    </HashRouter>
  );
}
