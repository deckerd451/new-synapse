// src/main.tsx
import { enableMapSet } from "immer";
enableMapSet();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";

// ✅ Import from the correct Supabase file (supabase.ts)
import { supabase } from "@/lib/supabaseClient";
console.log("🧩 Import check — supabase:", supabase);
console.log("🧩 Env check:", import.meta.env.VITE_SUPABASE_URL);


// ✅ Expose globally for console testing and older scripts
window.supabase = supabase;
console.log("🧠 Supabase initialized:", window.supabase);

// ✅ Apply dark theme globally
document.documentElement.classList.add("dark");

window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App /> {/* ✅ Uses your router from App.tsx */}
        <Toaster theme="dark" richColors closeButton />
      </StrictMode>
    );
    console.log("✅ React app mounted successfully (App router)");
  } else {
    console.error("❌ No #root element found!");
  }
});
