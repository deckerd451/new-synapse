import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

/**
 * ProfilePage allows an authenticated user to view and edit their
 * community profile.  The form is pre-populated with the current
 * profile data.  On submit the community table is updated and
 * local state is refreshed.  If no profile is present the user is
 * informed accordingly.
 */
export default function ProfilePage() {
  const { profile, setProfile, signOut } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    skills: "",
  });
  const [loading, setLoading] = useState(false);

  // Populate form when profile becomes available
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        bio: profile.bio ?? "",
        skills: Array.isArray(profile.skills)
          ? (profile.skills as string[]).join(", ")
          : (profile.skills as string) ?? "",
      });
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Profile</h1>
        <p>Loading profile…</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const updates = {
        name: form.name,
        bio: form.bio,
        skills: form.skills,
      } as Record<string, any>;
      const { data, error } = await supabase
        .from("community")
        .update(updates)
        .eq("id", profile.id)
        .select("*")
        .maybeSingle();
      if (error) {
        toast.error(error.message);
      } else if (data) {
        toast.success("Profile updated successfully.");
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="skills" className="block text-sm font-medium mb-1">
            Skills (comma-separated)
          </label>
          <input
            id="skills"
            type="text"
            className="w-full px-4 py-2 border rounded bg-transparent text-foreground focus:outline-none"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-6 bg-gold text-black font-semibold rounded hover:bg-gold/90 transition"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Navigation buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => (window.location.hash = "#/search")}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Go to Search
        </button>

        <button
          onClick={async () => {
            await signOut();
            window.location.hash = "#/login";
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
