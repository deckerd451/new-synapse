import "@/lib/errorReporter";
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // ✅ import your main App router
import "@/index.css";
import { Toaster } from "@/components/ui/sonner";

// Apply dark theme globally
document.documentElement.classList.add("dark");

// Wait for DOM and mount React app
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App /> {/* ✅ Now loads your HashRouter from App.tsx */}
        <Toaster theme="dark" richColors closeButton />
      </StrictMode>
    );
    console.log("✅ React app mounted successfully (App router)");
  } else {
    console.error("❌ No #root element found!");
  }
});
