// src/pages/Onboarding.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/network?tab=profile", { replace: true }); // ✅ sends them to HomePage with profile tab open
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background text-foreground">
      <h1 className="text-4xl font-bold text-gold mb-4">🎉 Welcome to Synapse!</h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Your account has been created successfully.  
        Let’s finish setting up your profile so others can connect with you.
      </p>
      <Button
        className="bg-gold text-background font-bold hover:bg-gold/90 transition-all"
        onClick={handleContinue}
      >
        Continue to Profile
      </Button>
    </div>
  );
}
