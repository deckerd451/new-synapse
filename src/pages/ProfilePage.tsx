import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/**
 * ProfilePage allows a logged‑in user to view and edit their community profile.
 * It loads the current profile from the auth store and lets the user update
 * their display name, bio and skills.  When the save button is clicked the
 * changes are persisted to the Supabase `community` table and the local
 * store is updated with the fresh data.
 */
export default function ProfilePage() {
  const { profile, setProfile } = useAuthStore();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  // Provide navigation so users can return to the network/dashboard page
  const navigate = useNavigate();

  // Populate form fields when the profile becomes available.
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
      // Convert an array of skills back into a comma‑separated list for editing.
      if (Array.isArray(profile.skills)) {
        setSkills(profile.skills.join(", "));
      } else if (typeof profile.skills === "string") {
        setSkills(profile.skills);
      } else {
        setSkills("");
      }
    }
  }, [profile]);

  // Save the updated profile values to the database.
  async function handleSave() {
    if (!profile) return;
    setLoading(true);
    try {
      // Convert the skills input back into a comma‑separated string.  Trim
      // whitespace and drop empty segments.
      const skillsList = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const updates = {
        name: name || null,
        bio: bio || null,
        skills: skillsList || null,
      };
      // Persist changes to the community table.  Only update valid columns.
      const { error } = await supabase
        .from("community")
        .update(updates)
        .eq("id", profile.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      // Reload the updated profile and hydrate the store.
      const { data: refreshed, error: fetchError } = await supabase
        .from("community")
        .select("*")
        .eq("id", profile.id)
        .maybeSingle();
      if (fetchError) {
        toast.error(fetchError.message);
        return;
      }
      if (refreshed) {
        setProfile(refreshed);
        toast.success("Profile updated!");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
        <div className="flex flex-col p-4 space-y-4 max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Profile</h1>
            {/* Back button allows users to navigate back to the network/dashboard */}
            <button
              onClick={() => navigate("/network")}
              className="text-sm underline text-cyan-400 hover:text-cyan-300"
            >
              Back to network
            </button>
          </div>
      <label className="block">
        <span className="block text-sm font-medium">Display Name</span>
        <input
          type="text"
          className="w-full mt-1 p-2 border rounded bg-transparent text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium">Bio</span>
        <textarea
          className="w-full mt-1 p-2 border rounded bg-transparent text-foreground"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium">Skills</span>
        <input
          type="text"
          className="w-full mt-1 p-2 border rounded bg-transparent text-foreground"
          placeholder="Enter skills separated by commas"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </label>
      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 bg-gold text-black font-semibold rounded hover:bg-gold/90 transition disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
