import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * LoginPage renders a simple email/password sign in form.  When a user
 * successfully signs in the page will automatically redirect to the
 * profile page.  Links are provided to create an account or reset a
 * forgotten password.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, profile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

      // If a profile is already present navigate to the dashboard home page.
      useEffect(() => {
        if (profile) {
          navigate('/');
        }
      }, [profile, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signIn(email, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form onSubmit={handleSubmit} className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <input
          type="email"
          className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-gold text-black font-semibold rounded hover:bg-gold/90 transition"
        >
          {loading ? 'Signing In…' : 'Sign In'}
        </button>
        <div className="flex justify-between text-sm">
          <Link to="/signup" className="text-gold hover:underline">
            Create account
          </Link>
          <Link to="/forgot-password" className="text-gold hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
