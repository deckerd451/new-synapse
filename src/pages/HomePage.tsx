import { useSearchParams } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import NavBar from '@/components/NavBar';

export default function HomePage() {
  // Require authentication for dashboard
  useAuthGuard(true);

  // Allow deep linking to a specific dashboard tab via ?tab=profile, search, etc.
  const [params] = useSearchParams();
  const tabParam = params.get("tab");

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Dashboard defaultTab={tabParam || "network"} />
      </div>
    </>
  );
}
