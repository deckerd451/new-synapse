// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // ✅ REQUIRED for GitHub Pages project path
  base: "/new-synapse/",

  plugins: [react()],

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

    // ✅ Cache-busting filenames (works with workflow)
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
