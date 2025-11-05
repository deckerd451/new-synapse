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

// ✅ Expose Supabase globally for debugging
window.supabase = supabase;
console.log("🧠 Supabase initialized:", window.supabase);

// ✅ Apply dark theme globally
document.documentElement.classList.add("dark");

// ✅ Wait for Supabase session hydration before mounting React
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🕒 Waiting for Supabase session hydration...");

  // Short delay to ensure Supabase restores session from localStorage
  await new Promise((res) => setTimeout(res, 300));

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
    console.log("✅ React app mounted successfully (HashRouter)");
  } else {
    console.error("❌ No #root element found!");
  }
});
