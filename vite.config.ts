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
  },
});
