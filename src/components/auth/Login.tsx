// src/components/auth/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { Mail, Github } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Use one redirect URL for both providers
  const redirectUrl = "https://deckerd451.github.io/#/onboarding";

  // 🧠 Redirect if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        console.log("✅ Existing session detected:", data.session.user.email);
        navigate("/network", { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // ✉️ Handle magic link login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📧 Sending magic link to:", email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      toast.success("Magic link sent! Check your inbox.");
      setEmail("");
    } catch (err: any) {
      console.error("❌ Login error:", err);
      toast.error(err.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Handle GitHub OAuth
  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      console.log("🐙 Redirecting to GitHub OAuth...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
      // Supabase redirects automatically to GitHub then back to redirectUrl
    } catch (err: any) {
      console.error("❌ GitHub OAuth error:", err);
      toast.error(err.message || "GitHub login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background/80 backdrop-blur-sm border-gold/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gold font-display">
            Synapse Link
          </CardTitle>
          <CardDescription>
            Enter the network. Sign in with your email or GitHub account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ✉️ Email login form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your-email@address.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 focus-visible:ring-gold"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gold text-background hover:bg-gold/90 font-bold"
              disabled={loading}
            >
              {loading ? "Sending magic link..." : "Sign In / Register"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* 🐙 GitHub OAuth button */}
          <Button
            onClick={handleGitHubLogin}
            className="w-full bg-[#24292F] hover:bg-[#1b1f23] text-white font-semibold flex items-center justify-center gap-2"
            disabled={loading}
          >
            <Github className="h-5 w-5" /> Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
      <Toaster theme="dark" richColors />
    </div>
  );
}
