import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * ResetPasswordRequestPage allows a user to request a password reset link
 * to be sent to their email.  Supabase will send an email with a
 * link back to the update-password page configured via redirectTo.
 */
export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset link sent! Please check your inbox.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form onSubmit={handleSubmit} className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <input
          type="email"
          className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gold text-black font-semibold rounded hover:bg-gold/90 transition"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <div className="text-sm text-center">
          Remember your password?{' '}
          <Link to="/login" className="text-gold hover:underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}