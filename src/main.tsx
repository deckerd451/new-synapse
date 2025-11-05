// src/main.tsx
import { enableMapSet } from "immer";
enableMapSet();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";

// ✅ Import Supabase client
import { supabase } from "@/lib/supabase"; // Ensure this path is correct!

// ✅ Expose globally so window.supabase.from() works anywhere
window.supabase = supabase;

// ✅ Apply dark mode theme globally
document.documentElement.classList.add("dark");

window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");

  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App /> {/* Uses your router from App.tsx */}
        <Toaster theme="dark" richColors closeButton />
      </StrictMode>
    );
    console.log("✅ React app mounted successfully (App router)");
  } else {
    console.error("❌ No #root element found!");
  }
});
