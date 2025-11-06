import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

/**
 * Error boundary component used to catch unexpected runtime errors.  If an
 * error bubbles up to this point the boundary will render a simple UI and
 * provide a button to reload the application.  Without this boundary the
 * application would render a blank screen on error which makes recovery
 * difficult for end‑users.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log errors for debugging purposes.  In a real application this could
    // be wired up to an external logging service.
    console.error("Caught error in boundary:", error, info);
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

/**
 * AppRouter defines all routes for the single page application.  It uses
 * React Router's <Routes> component to map paths to elements.  Depending on
 * whether the user is authenticated, it will either render the protected
 * pages or redirect back to the login view.  The higher‑level HashRouter
 * wrapper lives in src/main.tsx so we avoid nesting routers here.
 */
function AppRouter() {
  const { profile } = useAuthStore();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<Login />} />
      <Route path="/network" element={profile ? <HomePage /> : <Login />} />
      <Route
        path="/onboarding"
        element={profile ? <OnboardingPage /> : <Login />}
      />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

/**
 * The root application component.  It checks for an active Supabase session
 * before rendering the router.  During the initial check a loading screen
 * is displayed.  After hydration completes the router is rendered within
 * an error boundary to gracefully handle unexpected exceptions.
 */
export default function App() {
  const { checkUser, setProfile } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kick off an initial session check.  This will update the store
    // with the authenticated user if a persisted session exists.
    const initAuth = async () => {
      await checkUser();
      setLoading(false);
    };
    initAuth();

    // Listen for auth state changes from Supabase.  When a user signs in
    // or out we synchronise the Zustand store accordingly.  This listener
    // is automatically unsubscribed when the component unmounts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setProfile(session.user as any);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );

    // Delay rendering the router by a small amount to ensure the DOM
    // has hydrated.  Without this delay React Router may mount before
    // hydration is complete resulting in mismatched markup.
    const timer = setTimeout(() => {
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

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}