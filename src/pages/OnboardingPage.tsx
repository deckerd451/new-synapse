// src/pages/OnboardingPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { ensureCommunityUser } from "@/lib/ensureCommunityUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [skills, setSkills] = useState(
    typeof profile?.skills === "string"
      ? profile.skills
      : Array.isArray(profile?.skills)
      ? profile.skills.join(", ")
      : ""
  );
  const [loading, setLoading] = useState(false);

  // 🧠 On mount, ensure profile exists
  useEffect(() => {
    const initProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        console.warn("⚠️ No active user, redirecting to login");
        navigate("/login", { replace: true });
        return;
      }

      const communityUser = await ensureCommunityUser(user.email);
      if (communityUser) setProfile(communityUser);
    };
    initProfile();
  }, [navigate, setProfile]);

  // ✨ Save updates
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const cleanSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const updates = {
        name: name.trim(),
        bio: bio.trim(),
        skills: cleanSkills,
        profile_completed: name.trim().length > 1 && cleanSkills.length > 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("community")
        .update(updates)
        .eq("id", profile.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success("✅ Profile updated successfully!");

      // 🚀 If complete, go straight to network
      if (data.profile_completed) {
        toast.success("🎉 Onboarding complete! Redirecting to network...");
        setTimeout(() => navigate("/network", { replace: true }), 1500);
      }
    } catch (err: any) {
      console.error("❌ Onboarding update failed:", err);
      toast.error(err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-4xl font-bold text-gold font-display">
          🎉 Welcome to Synapse!
        </h1>
        <p className="text-muted-foreground">
          Your account has been created successfully. Let’s finish setting up
          your profile so others can connect with you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly introduce yourself..."
              className="resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <Input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, TypeScript, Node.js"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Separate skills with commas.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold text-background font-bold hover:bg-gold/90"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save and Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
