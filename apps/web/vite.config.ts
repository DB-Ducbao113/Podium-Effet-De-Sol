/// <reference types="vitest" />
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import modelBLocalCadPlugin from "./plugins/modelBLocalCadPlugin";
import itmAssetIdentity from "./src/dev/insideMachineI1/asset-identity.json";
import p5SeasonalManifest from "./src/data/visualAssets/p5SeasonalManifest.json";
import p5Extended2026Manifest from "./src/data/visualAssets/p5Extended2026Manifest.json";

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
const cinematicH32ReviewDir = path.resolve(
  import.meta.dirname,
  "../../.local-assets/recovered/homepage-h3-2",
);
const cinematicH32rReviewDir = path.resolve(
  import.meta.dirname,
  "../../.local-assets/recovered/homepage-h3-2r",
);
const checkedInCommercialModel = path.resolve(
  import.meta.dirname,
  "public/models/model-b-eds-optimized-v1.glb",
);
const commercialReviewModel = path.resolve(
  process.env.PEDS_MODEL_B_PATH ||
    (fs.existsSync(frozenCommercialModel)
      ? frozenCommercialModel
      : checkedInCommercialModel),
);
const expectedCommercialModelBytes = 2_120_816;
const expectedCommercialModelSha256 =
  "2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2";

const insideMachineLocalAssetsPlugin = {
  name: "inside-machine-local-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    const routeRoot = `/__itm-i2/${itmAssetIdentity.namespace}`;
    const assetDir = path.resolve(
      import.meta.dirname,
      `../../.local-assets/inside-the-machine/runtime/${itmAssetIdentity.namespace}`,
    );
    for (const asset of Object.values(itmAssetIdentity.assets)) {
      server.middlewares.use(`${routeRoot}/${asset.file}`, (request, response) => {
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.statusCode = 405;
          response.end("Method not allowed.");
          return;
        }
        const file = path.join(assetDir, asset.file);
        if (!fs.existsSync(file)) {
          response.statusCode = 404;
          response.end("Inside the Machine asset is unavailable.");
          return;
        }
        const data = fs.readFileSync(file);
        const sha256 = crypto.createHash("sha256").update(data).digest("hex").toUpperCase();
        if (data.length !== asset.bytes || sha256 !== asset.sha256) {
          response.statusCode = 409;
          response.end("Inside the Machine asset failed identity validation.");
          return;
        }
        const etag = `"sha256-${sha256.toLowerCase()}"`;
        response.setHeader("Content-Type", asset.type);
        response.setHeader("Content-Length", data.length);
        response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        response.setHeader("ETag", etag);
        if (request.headers["if-none-match"] === etag) {
          response.statusCode = 304;
          response.removeHeader("Content-Length");
          response.end();
          return;
        }
        response.end(request.method === "HEAD" ? undefined : data);
      });
    }
    server.middlewares.use("/__itm-i2", (_request, response) => {
      response.statusCode = 404;
      response.end("Unknown Inside the Machine asset.");
    });
  },
};

const p5SeasonalLocalAssetsPlugin = {
  name: "p5-seasonal-local-review-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    if (process.env.VITE_P5_LOCAL_REVIEW === "0") return;
    const repoRoot = path.resolve(import.meta.dirname, "../..");
    const entries = new Map<string, { sourceFile: string; bytes: number; sha256: string }>();
    for (const circuit of p5SeasonalManifest.circuits) {
      for (const variant of ["desktop", "mobile", "thumbnail"] as const) {
        entries.set(`/${circuit.season}/circuits/${variant}/${circuit.eventId.split(":")[1]}.webp`, circuit[variant]);
      }
    }
    for (const driver of p5SeasonalManifest.drivers) {
      for (const variant of ["full", "small"] as const) {
        entries.set(`/${driver.season}/drivers/${variant}/${driver.driverId}.webp`, driver[variant]);
      }
    }
    server.middlewares.use("/__p5-seasonal", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const entry = entries.get(request.url?.split("?")[0] || "");
      if (!entry) {
        response.statusCode = 404;
        response.end("Unknown review asset.");
        return;
      }
      const file = path.resolve(repoRoot, entry.sourceFile);
      if (!file.startsWith(repoRoot + path.sep) || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Review asset unavailable.");
        return;
      }
      const data = fs.readFileSync(file);
      const hash = crypto.createHash("sha256").update(data).digest("hex");
      if (data.length !== entry.bytes || hash !== entry.sha256) {
        response.statusCode = 409;
        response.end("Review asset identity mismatch.");
        return;
      }
      response.setHeader("Content-Type", "image/webp");
      response.setHeader("Content-Length", data.length);
      response.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
      response.end(request.method === "HEAD" ? undefined : data);
    });
  },
};

const p5Extended2026LocalAssetsPlugin = {
  name: "p5-extended-2026-local-review-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    if (process.env.VITE_P5_LOCAL_REVIEW === "0") return;
    const repoRoot = path.resolve(import.meta.dirname, "../..");
    const entries = new Map(p5Extended2026Manifest.files.map((asset) => [`/${asset.group}/${asset.name}`, asset]));
    server.middlewares.use("/__p5-extra-2026", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const asset = entries.get(request.url?.split("?")[0] || "");
      if (!asset) {
        response.statusCode = 404;
        response.end("Unknown review asset.");
        return;
      }
      const file = path.resolve(repoRoot, asset.sourceFile);
      if (!file.startsWith(repoRoot + path.sep) || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Review asset unavailable.");
        return;
      }
      const data = fs.readFileSync(file);
      const hash = crypto.createHash("sha256").update(data).digest("hex");
      if (data.length !== asset.bytes || hash !== asset.sha256) {
        response.statusCode = 409;
        response.end("Review asset identity mismatch.");
        return;
      }
      response.setHeader("Content-Type", "image/webp");
      response.setHeader("Content-Length", data.length);
      response.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
      response.end(request.method === "HEAD" ? undefined : data);
    });
  },
};

const commercialReviewAssetPlugin = {
  name: "peds-commercial-review-asset",
  apply: "serve" as const,
  enforce: "pre" as const,
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
    server.middlewares.use((request, response, next) => {
      const pathname = request.url ? new URL(request.url, "http://localhost").pathname : "";
      if (pathname === "/__peds-review/model-b.glb") {
        if (validationError) {
          response.statusCode = fs.existsSync(commercialReviewModel) ? 409 : 404;
          response.end(validationError);
          return;
        }
        response.setHeader("Content-Type", "model/gltf-binary");
        response.setHeader("Cache-Control", "no-store");
        fs.createReadStream(commercialReviewModel).pipe(response);
        return;
      }
      next();
    });
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
      ["tokyo-drift-h3-2-2x.mp4", "video/mp4", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-3x.mp4", "video/mp4", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-poster.png", "image/png", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2-3x-poster.png", "image/png", cinematicH32ReviewDir],
      ["tokyo-drift-h3-2r-homepage.mp4", "video/mp4", cinematicH32rReviewDir],
      ["tokyo-drift-h3-2r-homepage-poster.png", "image/png", cinematicH32rReviewDir],
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
    insideMachineLocalAssetsPlugin,
    modelBLocalCadPlugin(),
    p5SeasonalLocalAssetsPlugin,
    p5Extended2026LocalAssetsPlugin,
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
