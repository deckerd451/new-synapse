import { useSearchParams } from 'react-router-dom';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import NavBar from '@/components/NavBar';

/**
 * HomePage serves as the unified landing page for authenticated users.  It
 * displays a navigation bar and the main Dashboard component.  A `tab`
 * query parameter can be provided in the URL (e.g. `/#/?tab=search`) to
 * select a specific dashboard tab on load.  The `useAuthGuard` hook
 * ensures that unauthenticated visitors are redirected to the login page.
 */
export default function HomePage() {
  // Require authentication before showing the dashboard
  useAuthGuard(true);
  // Support deep‑linking to a specific dashboard tab via ?tab=profile/search/etc.
  const [params] = useSearchParams();
  const tabParam = params.get('tab');

  return (
    <>
      <NavBar />
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        {/* Use the Dashboard component with the provided tab or fall back to network */}
        <Dashboard defaultTab={tabParam || 'network'} />
      </div>
    </>
  );
}
