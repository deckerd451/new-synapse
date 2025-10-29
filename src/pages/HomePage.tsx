import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Login } from '@/components/auth/Login';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AppHeader } from '@/components/layout/AppHeader';
import { Zap } from 'lucide-react';
function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center animate-fade-out [animation-delay:2s] pointer-events-none">
      <div className="animate-fade-in">
        <Zap className="h-16 w-16 text-gold animate-pulse" />
        <h1 className="text-4xl font-bold text-gold font-display mt-4">Synapse Link</h1>
      </div>
    </div>
  );
}
export function HomePage() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [showSplash, setShowSplash] = useState(true);
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
            <Dashboard />
          </main>
        </>
      ) : (
        <Login />
      )}
      <footer className="text-center py-4 text-sm text-muted-foreground">
        Built with ❤️ at Cloudflare
      </footer>
    </div>
  );
}