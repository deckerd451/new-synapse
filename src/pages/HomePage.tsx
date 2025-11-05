// src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Login } from "@/components/auth/Login";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Zap } from "lucide-react";

function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center animate-fade-out [animation-delay:2s] pointer-events-none">
      <div className="animate-fade-in">
        <Zap className="h-16 w-16 text-gold animate-pulse" />
        <h1 className="text-4xl font-bold text-gold font-display mt-4">
          Synapse Link
        </h1>
      </div>
    </div>
  );
}

export function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Allow deep-linking to specific tabs like ?tab=profile
  const [params] = useSearchParams();
  const tabParam = params.get("tab");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {profile ? (
        <>
          <AppHeader />
          <main className="flex-1">
            {/* ✅ Pass tab param to Dashboard so it can open the right tab */}
            <Dashboard defaultTab={tabParam || "network"} />
          </main>
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}
export default HomePage;

