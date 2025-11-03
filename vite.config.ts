import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // ✅ Hard-code GitHub Pages base path — this fixes 404 routing
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
