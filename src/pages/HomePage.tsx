import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Login } from "@/components/auth/Login";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { BuildVersion } from "@/components/BuildVersion"; // 👈 ADD THIS LINE

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

export default function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Allow deep-linking to ?tab=profile etc.
  const [params] = useSearchParams();
  const tabParam = params.get("tab");

  // 🎬 Handle splash + delayed show
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // 🧠 Safety: ensure profile exists
  useEffect(() => {
    if (!loading && !profile) {
      toast.warning("Session expired — please sign in again.");
    }
  }, [loading, profile]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  // 🧱 Main content
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      {profile ? (
        <>
          <AppHeader />
          <main className="flex-1">
            {/* ✅ Pass optional ?tab param to Dashboard */}
            <Dashboard defaultTab={tabParam || "network"} />
          </main>
        </>
      ) : (
        <Login />
      )}

      {/* ✅ Add version label (always visible in corner) */}
      <BuildVersion />
    </div>
  );
}
