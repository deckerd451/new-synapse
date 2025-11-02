import "@/lib/errorReporter";
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import "@/index.css";
import { HomePage } from "@/pages/HomePage";
import { Toaster } from "@/components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
]);

// Apply dark theme globally
document.documentElement.classList.add("dark");

// Wait for DOM and mount React app
window.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <RouterProvider router={router} />
          <Toaster theme="dark" richColors closeButton />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log("✅ React app mounted successfully");
  } else {
    console.error("❌ No #root element found!");
  }
});
