<<<<<<< HEAD
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cloudflare from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],

  optimizeDeps: {
    exclude: ["@supabase/supabase-js"],
  },

  ssr: {
    noExternal: ["@supabase/supabase-js"], // ✅ prevents SSR optimizer from looking for UMD
  },

  build: {
    sourcemap: true,
    outDir: "dist",
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
=======
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 🚫 Force Vite to skip bundling node-fetch in browser builds
      "node-fetch": path.resolve(__dirname, "src/shims/node-fetch.js"),
      "@supabase/node-fetch": path.resolve(__dirname, "src/shims/node-fetch.js"),
    },
  },
  optimizeDeps: {
    exclude: ["@supabase/node-fetch", "node-fetch"],
  },
  define: {
    "global": "window",
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true,
    },
>>>>>>> eaaffaa (Updated Supabase integration and Bun worker environment setup)
  },
});
