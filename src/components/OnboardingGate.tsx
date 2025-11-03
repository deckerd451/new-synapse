// src/components/OnboardingGate.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

function isComplete(row: any) {
  // Option A: derived completeness
  const hasName = !!row?.name?.trim();
  const hasSkills = !!(row?.skills && String(row.skills).trim());
  return hasName && hasSkills; // tweak for your needs
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("community")
        .select("id, name, skills, image_url, profile_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(error);
        navigate("/login", { replace: true });
        return;
      }

      const complete = typeof data?.profile_completed === "boolean"
        ? data.profile_completed
        : isComplete(data);

      if (!complete) navigate("/onboarding", { replace: true });
      else setChecking(false);
    })();
  }, [navigate]);

  if (checking) return null; // or a spinner
  return <>{children}</>;
}
