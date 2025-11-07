import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/**
 * ResetPasswordPage
 * Handles password recovery links from Supabase on GitHub Pages (HashRouter).
 * Fixes the issue where the access_token is hidden behind the `#/` fragment
 * by normalizing the URL before calling exchangeCodeForSession().
 */
export default function ResetPasswordPage() {
  const { checkUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔄 Restore session from Supabase recovery link
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // ⚙️ Fix for GitHub Pages + HashRouter:
        // Supabase expects the token in the hash, but HashRouter adds its own `#/`.
        const normalizedUrl = window.location.href.replace("/#/", "/");

        const { data, error } = await supabase.auth.exchangeCodeForSession(normalizedUrl);
        if (error) {
          console.error("❌ Error exchanging code for session:", error.message);
        } else if (data?.session) {
          console.log("✅ Session restored:", data.session.user?.email);
        }
      } catch (err) {
        console.error("Unexpected error restoring session:", err);
      } finally {
        checkUser(); // hydrate profile if session was restored
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔑 Handle password update form
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
        // ✅ Redirect to login (HashRouter form)
        setTimeout(() => window.location.replace("/#/login"), 1500);
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
