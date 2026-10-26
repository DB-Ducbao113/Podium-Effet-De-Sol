/// <reference types="vitest" />
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

const cloudflareConfig = path.resolve(
  import.meta.dirname,
  "../../wrangler.jsonc",
);

const frozenCommercialModel = path.resolve(
  import.meta.dirname,
  "../../source-assets/models/model-b/model-b-eds-optimized-v1.glb",
);
const modelBReviewPreview = path.resolve(
  import.meta.dirname,
  "../../source-assets/models/model-b/model-b-prototype-overview.webp",
);
const cinematicReviewDir = path.resolve(
  import.meta.dirname,
  "../../scratch/frontend/homepage-h2-8-final",
);
const cinematicH29ReviewDir = path.resolve(
  import.meta.dirname,
  "../../scratch/frontend/homepage-h2-9-final",
);
const cinematicH30ReviewDir = path.resolve(
  import.meta.dirname,
  "../../scratch/frontend/homepage-h3-0-final",
);
const cinematicH31ReviewDir = path.resolve(
  import.meta.dirname,
  "../../scratch/frontend/homepage-h3-1-final",
);
const cinematicH32ReviewDir = path.resolve(
  import.meta.dirname,
  "../../scratch/frontend/homepage-h3-2-final",
);
const legacyLocalCommercialModel = path.resolve(
  import.meta.dirname,
  "../../.local-assets/model-b-eds-optimized-v1.glb",
);
const commercialReviewModel = path.resolve(
  process.env.PEDS_MODEL_B_PATH ||
    (fs.existsSync(frozenCommercialModel)
      ? frozenCommercialModel
      : legacyLocalCommercialModel),
);
const expectedCommercialModelBytes = 2_120_816;
const expectedCommercialModelSha256 =
  "2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2";

const commercialReviewAssetPlugin = {
  name: "peds-commercial-review-asset",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    let validationError: string | null = null;
    if (!fs.existsSync(commercialReviewModel)) {
      validationError = "Local PEDS Model B candidate is unavailable.";
    } else {
      const bytes = fs.readFileSync(commercialReviewModel);
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
      if (bytes.length !== expectedCommercialModelBytes || sha256 !== expectedCommercialModelSha256) {
        validationError = "Local PEDS Model B candidate failed frozen hash/size validation.";
      }
    }
    server.middlewares.use(
      "/__peds-review/model-b.glb",
      (_request, response) => {
        if (validationError) {
          response.statusCode = fs.existsSync(commercialReviewModel) ? 409 : 404;
          response.end(validationError);
          return;
        }
        response.setHeader("Content-Type", "model/gltf-binary");
        response.setHeader("Cache-Control", "no-store");
        fs.createReadStream(commercialReviewModel).pipe(response);
      },
    );
    server.middlewares.use("/__peds-review/model-b-overview.webp", (_request, response) => {
      if (!fs.existsSync(modelBReviewPreview)) {
        response.statusCode = 404;
        response.end("Local Model B preview is unavailable.");
        return;
      }
      response.setHeader("Content-Type", "image/webp");
      response.setHeader("Cache-Control", "no-store");
      fs.createReadStream(modelBReviewPreview).pipe(response);
    });
    for (const [name, contentType, reviewDir] of [
      ["tokyo-drift-final.mp4", "video/mp4", cinematicReviewDir],
      ["tokyo-drift-final-poster.png", "image/png", cinematicReviewDir],
      ["tokyo-drift-h2-9-final.mp4", "video/mp4", cinematicH29ReviewDir],
      ["tokyo-drift-h2-9-poster.png", "image/png", cinematicH29ReviewDir],
      ["tokyo-drift-h3-0-final.mp4", "video/mp4", cinematicH30ReviewDir],
      ["tokyo-drift-h3-0-poster.png", "image/png", cinematicH30ReviewDir],
      ["tokyo-drift-h3-1-2x.mp4", "video/mp4", cinematicH31ReviewDir],
      ["tokyo-drift-h3-1-2x-poster.png", "image/png", cinematicH31ReviewDir],
      ["tokyo-drift-h3-1-3x.mp4", "video/mp4", cinematicH31ReviewDir],
      ["tokyo-drift-h3-1-3x-poster.png", "image/png", cinematicH31ReviewDir],
      ["tokyo-drift-h3-2-2x.mp4", "video/mp4", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-3x.mp4", "video/mp4", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-poster.png", "image/png", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-3x-poster.png", "image/png", cinematicH32ReviewDir],
    ]) {
      server.middlewares.use(`/__peds-review/${name}`, (_request, response) => {
        const filePath = path.join(reviewDir, name);
        if (!fs.existsSync(filePath)) {
          response.statusCode = 404;
          response.end("Local cinematic review asset is unavailable.");
          return;
        }
        response.setHeader("Content-Type", contentType);
        response.setHeader("Cache-Control", "no-store");
        fs.createReadStream(filePath).pipe(response);
      });
    }
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
