/// <reference types="vitest" />
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

const cloudflareConfig = path.resolve(
  import.meta.dirname,
  "../../wrangler.jsonc",
);

const commercialReviewModel = path.resolve(
  process.env.PEDS_MODEL_B_PATH ||
    path.resolve(
      import.meta.dirname,
      "../../.local-assets/model-b-eds-optimized-v1.glb",
    ),
);

const commercialReviewAssetPlugin = {
  name: "peds-commercial-review-asset",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use(
      "/__peds-review/model-b.glb",
      (_request, response) => {
        if (!fs.existsSync(commercialReviewModel)) {
          response.statusCode = 404;
          response.end("Local PEDS Model B candidate is unavailable.");
          return;
        }
        response.setHeader("Content-Type", "model/gltf-binary");
        response.setHeader("Cache-Control", "no-store");
        fs.createReadStream(commercialReviewModel).pipe(response);
      },
    );
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    commercialReviewAssetPlugin,
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
