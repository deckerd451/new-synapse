import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * SignUpPage renders a form allowing a user to create a new account.
 * After successfully signing up the user is redirected to their
 * profile page.  A link back to the sign in page is provided.
 */
export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, loading, profile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

      // Redirect to dashboard if already authenticated
      useEffect(() => {
        if (profile) {
          navigate('/');
        }
      }, [profile, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await signUp(email, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form onSubmit={handleSubmit} className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Create Account</h1>
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
          {loading ? 'Creating…' : 'Create Account'}
        </button>
        <div className="text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
