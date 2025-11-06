import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// 🧩 Auth Guard Hook — reusable route protection
export function useAuthGuard(requireAuth = true) {
  const navigate = useNavigate();
  const { profile, loading } = useAuthStore();

  useEffect(() => {
    // Wait until the initial session check finishes
    if (loading) return;

    if (requireAuth && !profile) {
      console.warn("🔒 Redirecting to /login (no active session)");
      navigate("/login", { replace: true });
    }

    if (!requireAuth && profile) {
      console.log("✅ Already logged in — redirecting to /network");
      navigate("/network", { replace: true });
    }
  }, [profile, loading, navigate, requireAuth]);
}
