import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/**
 * ResetPasswordPage renders a form to allow users to set a new password
 * after following a password recovery link. On mount it exchanges the
 * Supabase URL code for a valid session, then calls checkUser() from the
 * auth store to hydrate the user profile. Once the session is active,
 * the user can enter a new password and submit the form.
 */
export default function ResetPasswordPage() {
  const { checkUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // ✅ New Supabase v2 method — replaces getSessionFromUrl()
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (error) {
          console.error("Error exchanging code for session:", error.message);
        } else if (data?.session) {
          console.log("✅ Session restored:", data.session);
        }
      } catch (err) {
        console.error("Unexpected error restoring session:", err);
      } finally {
        checkUser();
      }
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
        toast.success("Password updated successfully. You can now sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-card rounded shadow w-full max-w-sm space-y-4"
      >
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
