import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  HashRouter,
  useLocation,
} from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabaseClient";

// 🧩 Small component to log navigation & errors
function RouteLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log("🧭 Navigated to:", location.pathname);
  }, [location]);
  return null;
}

export default function App() {
  const { profile, loading, setProfile, checkUser } = useAuthStore();

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

    // 🔁 Refresh on tab focus
    const refreshOnFocus = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user) {
        console.log("🔄 Session revalidated on focus");
        setProfile(data.session.user);
      }
    };
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      console.log("🧹 Cleaning up Supabase listener...");
      subscription.unsubscribe();
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [setProfile, checkUser]);

  // 🌀 1️⃣ Hold UI until Supabase finishes hydration
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Checking your session...</p>
      </div>
    );
  }

  // 🚨 2️⃣ Wrap routes in a try/catch error boundary (no more crash loop)
  try {
    return (
      <HashRouter>
        <RouteLogger />
        {profile ? (
          <Routes>
            <Route path="/" element={<Navigate to="/network" replace />} />
            <Route path="/network" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/network" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </HashRouter>
    );
  } catch (err) {
    console.error("🚨 Router error:", err);
    return (
      <div className="min-h-screen flex items-center justify-center text-center bg-background text-foreground p-8">
        <p className="text-red-400 text-lg font-bold mb-2">
          An error occurred loading routes.
        </p>
        <p className="text-sm opacity-80">
          Please refresh the page or sign in again.
        </p>
      </div>
    );
  }
}
