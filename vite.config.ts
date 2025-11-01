import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  base: isProd ? "/new-synapse/" : "/", // ✅ Auto-switch
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
