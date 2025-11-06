// src/main.tsx (simplified)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabaseClient";

window.supabase = supabase;
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
      <Toaster theme="dark" richColors closeButton />
    </HashRouter>
  </StrictMode>
);
