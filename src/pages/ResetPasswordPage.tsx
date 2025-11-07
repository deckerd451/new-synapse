import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

/**
 * ResetPasswordPage renders a form allowing the user to set a new
 * password after following a password recovery link.  On mount the
 * component attempts to exchange any recovery code present in the URL
 * for a valid session.  If the session cannot be restored an error
 * message is displayed.  Otherwise the user can enter a new password
 * and submit the form.
 */
export default function ResetPasswordPage() {
  const { checkUser } = useAuthStore();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Attempt to restore the session from the URL when the component mounts.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Normalise the URL when using HashRouter so that the recovery
        // token appears after a single '#'.  Supabase expects the
        // token in the fragment for PKCE flows.  Without this fix
        // GitHub Pages / HashRouter adds '/#/' which hides the token.
        const normalizedUrl = window.location.href.replace('/#/', '/');
        const { error } = await supabase.auth.exchangeCodeForSession(normalizedUrl);
        if (error) {
          console.error('Error exchanging code for session:', error.message);
        }
      } catch (err: any) {
        console.error('Unexpected error exchanging code for session:', err);
      }
      // After attempting exchange, refresh local state
      await checkUser();
      // Inspect whether a session is present
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setSessionError('Invalid or expired password reset link. Please request a new reset email.');
      }
      setSessionChecked(true);
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully. You can now sign in.');
        // Redirect to login after a short delay.  Use HashRouter form
        setTimeout(() => {
          window.location.replace('/#/login');
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Authenticating your session…</p>
      </div>
    );
  }
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold">Reset Password</h1>
          <p>{sessionError}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Set New Password</h1>
        <input
          type="password"
          className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gold text-black font-semibold rounded hover:bg-gold/90 transition"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
