// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // 👈 make sure this import is present

export default defineConfig({
  plugins: [react()],

  // ✅ Required for GitHub Pages under /new-synapse/
  base: "/new-synapse/",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node-fetch": path.resolve(__dirname, "src/shims/node-fetch.js"),
      "@supabase/node-fetch": path.resolve(__dirname, "src/shims/node-fetch.js"),
    },
  },

  optimizeDeps: {
    exclude: ["@supabase/node-fetch", "node-fetch"],
  },

  define: {
    global: "window",
  },

  server: {
    port: 3000,
    strictPort: true,
    hmr: { overlay: true },
  },

  build: {
    sourcemap: true,
    outDir: "dist",
  },
});
