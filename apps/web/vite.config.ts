import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@monorepo/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@monorepo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@monorepo/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },
  server: {
    port: 3000,
  },
});
