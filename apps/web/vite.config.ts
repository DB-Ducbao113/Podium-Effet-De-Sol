/// <reference types="vitest" />
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

const cloudflareConfig = path.resolve(
  import.meta.dirname,
  "../../wrangler.jsonc",
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ...(mode === "test" ? [] : [cloudflare({ configPath: cloudflareConfig })]),
  ],
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/utils/**", "src/services/**"],
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    // The production CSP allows fonts from 'self' only, so small font subsets
    // must ship as files instead of Vite's default inline data: URL.
    assetsInlineLimit: (filePath: string) =>
      /\.(?:woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, "/");
          if (moduleId.includes("vite/preload-helper")) {
            return "vendor-core";
          }
          if (
            moduleId.includes("/node_modules/three/") ||
            moduleId.includes("/node_modules/three-stdlib/") ||
            moduleId.includes("/node_modules/@react-three/")
          ) {
            return "vendor-three";
          }
          if (
            moduleId.includes("/node_modules/react/") ||
            moduleId.includes("/node_modules/react-dom/") ||
            moduleId.includes("/node_modules/react-router") ||
            moduleId.includes("/node_modules/scheduler/") ||
            moduleId.includes("/node_modules/zustand/")
          ) {
            return "vendor-react";
          }
          if (moduleId.includes("/node_modules/lucide-react/")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
}));
