import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Login } from "@/components/auth/Login";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { BuildVersion } from "@/components/BuildVersion";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Splash screen shown briefly while the application is hydrating.  This
 * provides a smooth transition and prevents a flash of unstyled content.
 */
function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center pointer-events-none">
      <div className="animate-fade-in">
        <Zap className="h-16 w-16 text-gold animate-pulse" />
        <h1 className="text-4xl font-bold text-gold font-display mt-4">
          Synapse Link
        </h1>
      </div>
    </div>
  );
}

/**
 * Protected home page.  Displays the dashboard when the user is signed in
 * and falls back to the login view otherwise.  It also displays a splash
 * screen during initial hydration and warns the user if their session has
 * expired.
 */
export default function HomePage() {
  // Require authentication for this page
  useAuthGuard(true);

  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [showSplash, setShowSplash] = useState(true);

  // Allow deep‑linking to ?tab=profile etc.
  const [params] = useSearchParams();
  const tabParam = params.get("tab");

  // Handle splash + delayed show
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Safety: ensure profile exists
  useEffect(() => {
    if (!loading && !profile) {
      toast.warning("Session expired — please sign in again.");
    }
  }, [loading, profile]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      {profile ? (
        <>
          <AppHeader />
          <main className="flex-1">
            <Dashboard defaultTab={tabParam || "network"} />
          </main>
        </>
      ) : (
        <Login />
      )}
      {/* Add version label (always visible in corner) */}
      <BuildVersion />
    </div>
  );
}