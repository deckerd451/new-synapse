import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";

/**
 * Onboarding page displayed immediately after a new user signs up.  It
 * verifies that a Supabase session exists before redirecting to the
 * network page.  If no session is detected after several retries the
 * user is returned to the login page.
 */
export default function OnboardingPage() {
  // Require authentication for this page
  useAuthGuard(true);

  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "checking" | "waiting" | "ready" | "error"
  >("checking");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const verifySession = async () => {
      if (cancelled) return;

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus("error");
        return;
      }

      // Found a valid session in memory
      if (data?.session?.user) {
        setStatus("ready");
        navigate("/network", { replace: true });
        return;
      }

      // Fallback: try direct getUser (bypasses localStorage lag)
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setStatus("ready");
        navigate("/network", { replace: true });
        return;
      }

      attempts++;
      if (attempts <= maxAttempts) {
        setStatus("waiting");
        await delay(700 * attempts);
        await verifySession();
      } else {
        setStatus("error");
      }
    };

    verifySession();

    // Listen for auth state changes.  If a session is created while
    // the user is on this page we'll immediately redirect them to
    // the network.  Likewise, if they sign out we return them to login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          setStatus("ready");
          navigate("/network", { replace: true });
        } else if (event === "SIGNED_OUT") {
          setStatus("error");
          navigate("/login", { replace: true });
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Loading state
  if (status === "checking" || status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg animate-pulse">Authenticating your session...</p>
      </div>
    );
  }

  // Displayed only briefly before redirect
  if (status === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
        <h1 className="text-4xl font-bold text-gold mb-2">Welcome to Synapse!</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Your account has been created successfully. Let’s finish setting up your profile so others can connect with you.
        </p>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold text-red-400 mb-2">Session Expired</h1>
      <p className="text-muted-foreground mb-4">Please sign in again to continue.</p>
      <button
        onClick={() => navigate("/login")}
        className="px-4 py-2 bg-gold text-black rounded-lg font-semibold hover:bg-gold/90 transition"
      >
        Return to Login
      </button>
    </div>
  );
}
