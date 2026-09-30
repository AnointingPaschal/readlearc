import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Cloudflare Pages: the SPA in /dist is served statically; /functions (Pages Functions) serve /api/*.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 3000,
    // `npm run dev:cf` runs Pages Functions + KV locally on :8788
    proxy: { "/api": "http://127.0.0.1:8788" },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          ethers: ["ethers"],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
