// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cloudflare from "@cloudflare/vite-plugin";

// --------------------------------------------------
//  Vite configuration for Synapse Link (Supabase)
// --------------------------------------------------
//  Fixes Supabase UMD error by excluding it from pre-bundling
//  and ensures compatibility with ESM-only libraries.
// --------------------------------------------------

export default defineConfig({
  plugins: [
    react(),
    cloudflare(), // Keep Cloudflare plugin for workers build compatibility
  ],

  optimizeDeps: {
    exclude: ["@supabase/supabase-js"], // ✅ Prevents Vite from searching for non-existent UMD build
  },

  build: {
    sourcemap: true,
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },

  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
