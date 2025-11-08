import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export default function NavBar() {
  const { profile, signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    toast.info("Signed out successfully.");
    window.location.hash = "#/login";
  };

  return (
    <nav className="w-full bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div
          className="text-lg font-bold cursor-pointer hover:text-gold transition"
          onClick={() => (window.location.hash = "#/profile")}
        >
          Synapse Link
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => (window.location.hash = "#/profile")}
            className="hover:text-gold transition"
          >
            Profile
          </button>
          <button
            onClick={() => (window.location.hash = "#/search")}
            className="hover:text-gold transition"
          >
            Search
          </button>

          <div className="border-l border-gray-600 h-5 mx-2" />

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition"
          >
            Logout
          </button>

          {profile?.name && (
            <span className="text-sm text-gray-400 ml-2">
              {profile.name}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
