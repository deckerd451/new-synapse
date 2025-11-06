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
document.documentElement.classList.add("dark");

// ✅ 1. Handle all Supabase redirects (magic link + GitHub OAuth)
(async () => {
  const hash = window.location.hash;
  const query = window.location.search;

  // Supabase redirects can use hash (#) OR query (?)
  const urlParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : query.slice(1));

  const access_token = urlParams.get("access_token");
  const refresh_token = urlParams.get("refresh_token");

  if (access_token && refresh_token) {
    console.log("🔐 Restoring Supabase session from redirect tokens...");
    try {
      await supabase.auth.setSession({ access_token, refresh_token });
      console.log("✅ Session restored successfully");
    } catch (err) {
      console.error("❌ Error restoring session:", err);
    }

    // Clean up the URL
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();

// ✅ 2. Mount React app
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🕒 Waiting for Supabase session hydration...");
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
  }
});
