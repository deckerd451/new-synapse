import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";

export default function ProfilePage() {
  const { profile, setProfile, signOut } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    skills: "",
    image_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Preload form data when profile is ready
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        bio: profile.bio ?? "",
        skills: Array.isArray(profile.skills)
          ? (profile.skills as string[]).join(", ")
          : (profile.skills as string) ?? "",
        image_url: profile.image_url ?? "",
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

  /** Handle uploading a new profile picture */
  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}-${Date.now()}.${fileExt}`;

      // Upload to your existing public bucket
      const { error: uploadError } = await supabase.storage
        .from("hacksbucket")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Retrieve the public URL
      const { data } = supabase.storage.from("hacksbucket").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update the image_url in the community table
      const { error: dbError } = await supabase
        .from("community")
        .update({ image_url: publicUrl })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setProfile({ ...profile, image_url: publicUrl });
      toast.success("Profile image updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error uploading image.");
    } finally {
      setUploading(false);
    }
  }

  /** Handle saving text updates */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const updates = {
        name: form.name,
        bio: form.bio,
        skills: form.skills,
      };
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
      <NavBar />
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-4">
        <img
          src={form.image_url || "https://placehold.co/100x100?text=No+Image"}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border mb-2"
        />
        <label className="cursor-pointer text-sm text-gold hover:underline">
          {uploading ? "Uploading…" : "Change picture"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>

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

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => (window.location.hash = "#/?tab=search")}
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
