// src/main.tsx
import { enableMapSet } from "immer";
enableMapSet();

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabaseClient";

window.supabase = supabase;
console.log("🧠 Supabase initialized:", window.supabase);

// ✅ Ensure we’re always using a hash URL for GitHub Pages
if (!window.location.hash) {
  console.warn("⚠️ No hash detected — redirecting to #/login");
  window.location.replace(window.location.href + "#/login");
}

// ✅ Apply dark mode globally
document.documentElement.classList.add("dark");

window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <HashRouter>
          <App />
          <Toaster theme="dark" richColors closeButton />
        </HashRouter>
      </StrictMode>
    );
    console.log("✅ React app mounted successfully (App router)");
  } else {
    console.error("❌ No #root element found!");
  }
});
