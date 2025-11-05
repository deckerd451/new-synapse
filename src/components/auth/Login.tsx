// src/components/auth/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
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
import { Mail } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("📧 Sending magic link to:", email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // ✅ Critical for GitHub Pages redirect
          emailRedirectTo:
            "https://deckerd451.github.io/new-synapse/#/onboarding",
        },
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-background/80 backdrop-blur-sm border-gold/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gold font-display">
            Synapse Link
          </CardTitle>
          <CardDescription>
            Enter the network. Provide an email to sign in or create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
        </CardContent>
      </Card>
      <Toaster theme="dark" richColors />
    </div>
  );
}
