import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base: "/admin/" — served behind the reverse proxy at breads.sytes.net/admin
export default defineConfig({
  base: "/admin/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
