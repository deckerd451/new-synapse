import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function Login() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🧩 Automatically switch to reset mode if redirected by Supabase
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset");
    }
  }, []);

  // 🔑 Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(`Welcome back, ${email}!`);
  };

  // 🧾 Sign-up
  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to confirm.");
  };


  // ✉️ Request password reset email
  const handleForgot = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://deckerd451.github.io/new-synapse/#/reset-password",
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password-reset link sent to your email.");
  };

  // 🔐 Complete password reset (after clicking email link)
  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Password updated! You can now sign in.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background/80 backdrop-blur-sm border-gold/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gold font-display">
            Synapse Link
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gold text-background hover:bg-gold/90 font-bold"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-gold/50 text-gold hover:bg-gold/10 hover:text-gold"
                onClick={() => setMode("signup")}
                disabled={loading}
              >
                Create Account
              </Button>
              <Button
                variant="link"
                type="button"
                onClick={() => setMode("forgot")}
                className="w-full text-sm text-muted-foreground hover:text-gold/80"
              >
                Forgot password?
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSignUp();
              }}
              className="space-y-3"
            >
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gold text-background hover:bg-gold/90 font-bold"
                disabled={loading}
              >
                {loading ? "Creating..." : "Sign Up"}
              </Button>
              <Button
                variant="link"
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-muted-foreground hover:text-gold/80"
              >
                Back to login
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleForgot();
              }}
              className="space-y-3"
            >
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gold text-background hover:bg-gold/90 font-bold"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <Button
                variant="link"
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-muted-foreground hover:text-gold/80"
              >
                Back to login
              </Button>
            </form>
          )}

          {mode === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleReset();
              }}
              className="space-y-3"
            >
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="w-full bg-gold text-background hover:bg-gold/90 font-bold"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
