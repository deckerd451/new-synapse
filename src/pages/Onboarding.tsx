// src/pages/Onboarding.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Onboarding() {
  const navigate = useNavigate();

  const handleContinue = () => {
    // ✅ Redirect user to the Profile tab
    navigate("/profile", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold text-gold mb-4">🎉 Welcome to Synapse!</h1>
      <p className="text-lg text-muted-foreground max-w-lg mb-8">
        You’re all set up with your account.  
        Let’s complete your profile so the community can find and connect with you.
      </p>
      <Button
        className="bg-gold text-background font-bold hover:bg-gold/90 transition-all"
        onClick={handleContinue}
