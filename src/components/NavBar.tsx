import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Moon, Sun, Menu, X } from "lucide-react";

export default function NavBar() {
  const { profile, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const handleLogout = async () => {
    await signOut();
    toast.info("Signed out successfully.");
    window.location.hash = "#/login";
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  // Restore persisted theme on load
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  return (
    <nav className="w-full bg-gray-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo / Title */}
        <div
          onClick={() => (window.location.hash = "#/profile")}
          className="text-lg font-bold cursor-pointer hover:text-gold transition"
        >
          Synapse Link
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
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

          <button
            onClick={toggleTheme}
            className="p-1 rounded hover:bg-gray-800 transition"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition"
          >
            Logout
          </button>

          {profile?.name && (
            <span className="text-sm text-gray-400 ml-2">{profile.name}</span>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 px-4 pb-3 space-y-3 animate-slide-down">
          <button
            onClick={() => {
              window.location.hash = "#/profile";
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left hover:text-gold transition"
          >
            Profile
          </button>
          <button
            onClick={() => {
              window.location.hash = "#/search";
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left hover:text-gold transition"
          >
            Search
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 hover:text-gold transition"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
