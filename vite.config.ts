import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Defaults to root — the /admin prefix is an nginx routing concern, not
// something this app hardcodes. Deploy build passes BASE_PATH=/admin/.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
