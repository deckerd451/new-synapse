import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Check, X } from "lucide-react";
import { supabase, ensureCommunityUser } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom"; // ✅ NEW: for redirect

// 🧩 Schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
  skills: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileTab() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate(); // ✅ NEW: navigation hook

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "", skills: "" },
  });

  // 🧠 Load profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        bio: profile.bio || "",
        skills:
          typeof profile.skills === "string"
            ? profile.skills
            : Array.isArray(profile.skills)
            ? profile.skills.join(", ")
            : "",
      });
    }
  }, [profile, form]);

  // 🧩 Normalize skills before saving
  const cleanSkills = (skills?: string) => {
    if (!skills) return "";
    return skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(", ");
  };

// 🧭 Handle form submit
const onSubmit = async (data: ProfileFormValues) => {
  if (!profile) return;
  setLoading(true);

  try {
    await ensureCommunityUser();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    // 🧩 Normalize and build update payload
    const cleanSkillsValue = cleanSkills(data.skills);
    const nowComplete =
      data.name.trim().length > 1 && cleanSkillsValue.trim().length > 0;

    const updates = {
      name: data.name.trim(),
      bio: typeof data.bio === "string" ? data.bio.trim() : "",
      skills: cleanSkillsValue,
      profile_completed: nowComplete, // ✅ auto-mark complete
      updated_at: new Date().toISOString(),
      user_id: user?.id || profile.user_id,
      email: profile.email || user?.email || "",
    };

    const { data: updatedProfile, error } = await supabase
      .from("community")
      .update(updates)
      .eq("user_id", user?.id || profile.user_id)
      .select(
        "id, name, email, bio, skills, image_url, user_id, updated_at, profile_completed"
      )
      .single();

    if (error) throw error;

    // ✅ Immediately sync Zustand store so UI reflects updates
    setProfile(updatedProfile);
    toast.success("✅ Profile updated successfully!");

    // 🎉 If this is their first time completing setup, auto-redirect
    if (!profile.profile_completed && nowComplete) {
      toast.success("🎉 Profile complete! Redirecting you to the network...");
      setTimeout(() => navigate("/network"), 1500);
    }
  } catch (err: any) {
    console.error("Error updating profile:", err);
    toast.error(err.message || "Failed to update profile.");
  } finally {
    setLoading(false);
  }
};


  // 🖼️ Crop image to square
  const cropToSquare = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context missing");
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            size,
            size
          );
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject("Failed to create blob")),
            "image/jpeg",
            0.9
          );
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // 🟨 File upload handler
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const cropped = await cropToSquare(file);
      setPreviewUrl(URL.createObjectURL(cropped));
      setPreviewBlob(cropped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process image.");
    }
  };

  // ✅ Confirm upload
  const confirmUpload = async () => {
    if (!previewBlob || !profile?.id) return;
    setUploading(true);

    try {
      await ensureCommunityUser();

      const filePath = `${profile.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("hacksbucket")
        .upload(filePath, previewBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("hacksbucket")
        .getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("community")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, image_url: publicUrl });
      setPreviewUrl(null);
      setPreviewBlob(null);
      toast.success("✅ Profile photo updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  // 🧱 UI
  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-gold/50">
            <AvatarImage
              src={profile?.image_url || undefined}
              alt={profile?.name || "User"}
            />
            <AvatarFallback className="bg-muted text-3xl">
              {profile?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-2xl font-bold">
              {profile?.name || "Your Profile"}
            </h2>
            <p className="text-muted-foreground">{profile?.email}</p>

            <div className="mt-2 flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 max-w-xl"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, TypeScript, Node.js"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Enter skills separated by commas.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-gold text-background hover:bg-gold/90 font-bold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="bg-background rounded-2xl p-8 shadow-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Preview Your New Profile Photo
            </h2>
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-full w-40 h-40 object-cover border-4 border-gold shadow-lg mb-6"
            />
            <div className="flex gap-4">
              <Button
                onClick={confirmUpload}
                disabled={uploading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Confirm"}
              </Button>
              <Button variant="destructive" onClick={cancelPreview}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
