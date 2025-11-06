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

// 🧩 Router isolated for safe mount
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

export default function App() {
  const { checkUser, setProfile } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");

    const init = async () => {
      console.log("🔍 Checking Supabase session...");
      await checkUser();
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Supabase auth event:", event);
      if (session?.user) {
        console.log("✅ Logged in:", session.user.email);
        setProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        console.log("👋 Signed out");
        setProfile(null);
      }
    });

    // 🕓 Give router time to safely hydrate
    const timer = setTimeout(() => {
      console.log("🟢 Router safe to mount");
      setReady(true);
    }, 800);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [checkUser, setProfile]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // ✅ Render router inside boundary
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </HashRouter>
  );
}
