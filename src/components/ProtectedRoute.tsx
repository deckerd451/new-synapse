import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * ProtectedRoute ensures that a route is only accessible if a user
 * profile is present.  While the auth store is loading it displays
 * a placeholder.  If no profile is present the user is redirected to
 * the login page.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading…</p>
      </div>
    );
  }
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}