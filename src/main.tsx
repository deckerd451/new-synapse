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

// ✅ Handle Supabase magic link & OAuth redirects
(async () => {
  const hash = window.location.hash;
  const query = window.location.search;

  // Supabase may return either #access_token or ?access_token
  const urlParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : query.slice(1)
  );

  const access_token = urlParams.get("access_token");
  const refresh_token = urlParams.get("refresh_token");

  if (access_token && refresh_token) {
    console.log("🔐 Restoring Supabase session from redirect...");
    try {
      await supabase.auth.setSession({ access_token, refresh_token });
      console.log("✅ Session restored successfully!");
    } catch (err) {
      console.error("❌ Error restoring Supabase session:", err);
    }

    // 🧹 Clean up the URL (removes #access_token=... etc.)
    const cleanUrl =
      window.location.origin +
      window.location.pathname +
      "#/onboarding";
    window.history.replaceState({}, document.title, cleanUrl);
  }
})();

// ✅ Wait for Supabase session hydration before mounting React
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🕒 Waiting for Supabase session hydration...");

  // Small delay for localStorage sync
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
