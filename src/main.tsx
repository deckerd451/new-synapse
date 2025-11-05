import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // ✅ make sure this line exists!
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabaseClient"; // 👈 ADD THIS LINE

// 👇 ADD THIS LINE to expose Supabase globally for console testing
window.supabase = supabase;

// Apply dark theme globally
document.documentElement.classList.add("dark");

window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />  {/* ✅ uses your router from App.tsx */}
        <Toaster theme="dark" richColors closeButton />
      </StrictMode>
    );
    console.log("✅ React app mounted successfully (App router)");
  } else {
    console.error("❌ No #root element found!");
  }
});
