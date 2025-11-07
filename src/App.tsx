import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";
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
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
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
 * Defines all routes for the application.  Depending on whether a user
 * profile is available the protected routes will either render the
 * requested component or fallback to the login page.
 */
function AppRouter() {
  const { profile } = useAuthStore();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
          {/*
           * Route for password reset.  When a user follows a password recovery
           * link they will land on this path.  The ResetPasswordPage is
           * responsible for restoring the Supabase session (via checkUser())
           * and then allowing the user to set a new password.
           */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/network" element={profile ? <HomePage /> : <Login />} />
          {/* Profile editing route; requires an authenticated profile */}
          <Route path="/profile" element={profile ? <ProfilePage /> : <Login />} />
      <Route
        path="/onboarding"
        element={profile ? <OnboardingPage /> : <Login />}
      />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

/**
 * Root component.  It runs an initial session check on mount and listens
 * for auth state changes from Supabase.  While the store reports that
 * it's still loading an existing session we display a simple loading
 * screen; otherwise we render the router wrapped in an error boundary.
 */
export default function App() {
  const { loading, checkUser, setProfile } = useAuthStore();
  useEffect(() => {
    // perform initial session check
    checkUser();
    // subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // when a session is restored or a user signs in, refresh the
          // profile from the database
          checkUser();
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [checkUser, setProfile]);
  // show a simple loader until session check completes
  if (loading) {
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
