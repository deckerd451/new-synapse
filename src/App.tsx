import { useEffect, useState } from "react";
import { Routes, Route, HashRouter } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

// 🧱 Simple error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  return hasError ? (
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
  ) : (
    <React.ErrorBoundary
      fallbackRender={() => setHasError(true)}
    >
      {children}
    </React.ErrorBoundary>
  );
}

export default function App() {
  const { profile, loading, setProfile, checkUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log("🧠 Initializing Supabase auth handling...");
    checkUser();

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
      setReady(true);
    }, 1200);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [setProfile, checkUser]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // 🧩 Render router safely within ErrorBoundary
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          {/* Root decision logic */}
          <Route
            path="/"
            element={
              profile ? (
                <HomePage />
              ) : (
                <Login /> // ✅ Show login directly, no Navigate yet
              )
            }
          />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/network"
            element={profile ? <HomePage /> : <Login />}
          />
          <Route
            path="/onboarding"
            element={profile ? <OnboardingPage /> : <Login />}
          />

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
