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

// ✅ Handle Supabase magic-link redirect hash (GitHub Pages fix)
(async () => {
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    const params = new URLSearchParams(hash.replace("#", "?"));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      console.log("🔐 Restoring Supabase session from URL hash...");
      await supabase.auth.setSession({ access_token, refresh_token });
      window.location.hash = ""; // clean up the URL
      console.log("✅ Supabase session restored after redirect");
    }
  }
})();

// ✅ Wait for Supabase session hydration before mounting React
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🕒 Waiting for Supabase session hydration...");

  await new Promise((res) => setTimeout(res, 300)); // allow localStorage restore

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
