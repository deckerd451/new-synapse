import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/**
 * ResetPasswordPage renders a form to allow users to set a new password
 * after following a password recovery link.  On mount it calls
 * checkUser() from the auth store, which will restore the Supabase
 * session if the URL contains `access_token` and `refresh_token`
 * parameters.  Once a session is present, the user can enter a new
 * password and submit the form.  If the update succeeds, a success
 * notification is displayed.  Otherwise an error notification is shown.
 */
export default function ResetPasswordPage() {
  const { checkUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // On mount, attempt to restore the session from the URL.  Password recovery
  // links may only include an access token or code, so use the built‑in
  // helper to exchange it for a session and store it.  Afterwards, call
  // checkUser() to hydrate the profile if necessary.
  useEffect(() => {
    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .catch(() => {
        /* no-op */
      })
      .finally(() => {
        checkUser();
      });
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
        toast.success("Password updated successfully. You can now sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form onSubmit={handleSubmit} className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Synapse Link</h1>
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
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}
