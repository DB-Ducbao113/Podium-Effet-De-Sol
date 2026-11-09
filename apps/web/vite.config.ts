/// <reference types="vitest" />
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import itmAssetIdentity from "./src/dev/insideMachineI1/asset-identity.json";
import p5SeasonalManifest from "./src/data/visualAssets/p5SeasonalManifest.json";
import p5Extended2026Manifest from "./src/data/visualAssets/p5Extended2026Manifest.json";
import historicalStandingsReviewManifest from "../../docs/asset-manifests/p5-historical-standings-review.json";
import miniRaceReviewManifest from "../../docs/asset-manifests/mini-race-2026-review.json";
import miniRaceHistoricalReviewManifest from "../../docs/asset-manifests/mini-race-2024-2025-review.json";
import showroomIntroReviewManifest from "../../docs/asset-manifests/showroom-intro-v3-review.json";

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

const historicalStandingsLocalAssetsPlugin = {
  name: "p5-historical-standings-local-review-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    const localDir = path.resolve(import.meta.dirname, "../../.local-assets/p5-historical-standings-v2");
    const entries = new Map(historicalStandingsReviewManifest.assets.map((asset) => [`/${asset.season}.webp`, asset]));
    server.middlewares.use("/__p5-historical-standings", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const asset = entries.get(request.url?.split("?")[0] ?? "");
      const file = asset && path.resolve(localDir, asset.file);
      if (!asset || !file || !file.startsWith(localDir + path.sep) || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Historical standings review asset unavailable.");
        return;
      }
      const data = fs.readFileSync(file);
      if (data.length !== asset.bytes || crypto.createHash("sha256").update(data).digest("hex") !== asset.sha256) {
        response.statusCode = 409;
        response.end("Historical standings review asset identity mismatch.");
        return;
      }
      response.setHeader("Content-Type", "image/webp");
      response.setHeader("Content-Length", data.length);
      response.setHeader("Cache-Control", "private, no-store");
      response.end(request.method === "HEAD" ? undefined : data);
    });
  },
};

// These cinematic concept crops are private owner-review media, NOT production assets.
// Source files stay outside public/ and the route exists in Vite serve mode only.
const homeExploreReviewAssets = {
  showroom: { file: "showroom.webp", bytes: 28720, sha256: "499d7e9c0a06ef826dc721c5a8efd50d30aa80f427fb185c2dc74f0ea193b018" },
  engineering: { file: "engineering.webp", bytes: 32990, sha256: "f8f0961c7f5d895519605b06525a9442d84a4949384cac964fd89cbf8cc63e3e" },
  drivers: { file: "drivers.webp", bytes: 26846, sha256: "2d2d177ef0de27c887346984b50923cebb7c58c3dcc64c92cd5f1245a5d9f6f7" },
  teams: { file: "teams.webp", bytes: 23314, sha256: "6edf89cf2a6ccd4722e45ffdc3b2988bbdf9534b7de835e7537792f6a8b7f829" },
} as const;

const homeExploreLocalAssetsPlugin = {
  name: "peds-home-explore-local-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    const localDir = path.resolve(import.meta.dirname, "../../.local-assets/home-explore-v2");
    server.middlewares.use("/__peds-home-explore", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const match = /^\/(showroom|engineering|drivers|teams)\.webp$/.exec(request.url?.split("?")[0] ?? "");
      if (!match) {
        response.statusCode = 404;
        response.end("Unknown Explore review image.");
        return;
      }
      const key = match[1] as keyof typeof homeExploreReviewAssets;
      const item = homeExploreReviewAssets[key];
      const file = path.join(localDir, item.file);
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Explore review image not installed.");
        return;
      }
      const data = fs.readFileSync(file);
      const sha256 = crypto.createHash("sha256").update(data).digest("hex");
      if (data.length !== item.bytes || sha256 !== item.sha256) {
        response.statusCode = 409;
        response.end("Explore image hash/size mismatch.");
        return;
      }
      response.setHeader("Content-Type", "image/webp");
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Content-Length", data.length);
      response.end(request.method === "HEAD" ? undefined : data);
    });
  },
};

const miniRaceLocalAssetsPlugin = {
  name: "peds-mini-race-local-review-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    const packs = [
      {
        localDir: path.resolve(import.meta.dirname, "../../.local-assets/mini-race-2026"),
        assets: miniRaceReviewManifest.assets,
      },
      {
        localDir: path.resolve(import.meta.dirname, "../../.local-assets/mini-race-2024-2025"),
        assets: miniRaceHistoricalReviewManifest.assets,
      },
    ];
    const entries = new Map(
      packs.flatMap(({ localDir, assets }) =>
        assets.flatMap((asset) =>
          [asset.gif, asset.poster].map((assetFile) => [
            `/${assetFile.file}`,
            { localDir, assetFile },
          ] as const),
        ),
      ),
    );
    server.middlewares.use("/__peds-mini-race", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const asset = entries.get(request.url?.split("?")[0] ?? "");
      if (!asset) {
        response.statusCode = 404;
        response.end("Unknown Mini Race review asset.");
        return;
      }
      const file = path.resolve(asset.localDir, asset.assetFile.file);
      if (!file.startsWith(asset.localDir + path.sep) || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Mini Race review asset unavailable.");
        return;
      }
      const data = fs.readFileSync(file);
      if (data.length !== asset.assetFile.bytes || crypto.createHash("sha256").update(data).digest("hex") !== asset.assetFile.sha256) {
        response.statusCode = 409;
        response.end("Mini Race review asset identity mismatch.");
        return;
      }
      response.setHeader("Content-Type", asset.assetFile.file.endsWith(".gif") ? "image/gif" : "image/webp");
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Content-Length", data.length);
      response.end(request.method === "HEAD" ? undefined : data);
    });
  },
};

// Owner-review Showroom intro media: serve mode only, never part of a production build.
const showroomIntroReviewPlugin = {
  name: "peds-showroom-intro-review-assets",
  apply: "serve" as const,
  configureServer(server: import("vite").ViteDevServer) {
    const directory = path.resolve(import.meta.dirname, "../../.local-assets/showroom-intro-v3");
    const assets = new Map(showroomIntroReviewManifest.assets.map((asset) => [asset.file, asset]));
    server.middlewares.use("/__peds-showroom-intro", (request, response) => {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.statusCode = 405;
        response.end("Method not allowed.");
        return;
      }
      const name = request.url?.slice(1).split("?")[0] ?? "";
      const asset = assets.get(name);
      const file = asset && path.join(directory, asset.file);
      if (!asset || !file || !file.startsWith(directory + path.sep) || !fs.existsSync(file)) {
        response.statusCode = 404;
        response.end("Showroom intro review asset unavailable.");
        return;
      }
      const data = fs.readFileSync(file);
      if (data.length !== asset.bytes || crypto.createHash("sha256").update(data).digest("hex") !== asset.sha256) {
        response.statusCode = 409;
        response.end("Showroom intro review asset identity mismatch.");
        return;
      }
      response.setHeader("Content-Type", asset.type);
      response.setHeader("Cache-Control", "private, no-store");
      response.setHeader("Accept-Ranges", "bytes");
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        const start = match ? Number(match[1]) : -1;
        const end = match && match[2] ? Number(match[2]) : data.length - 1;
        if (start < 0 || start >= data.length || end < start || end >= data.length) {
          response.statusCode = 416;
          response.setHeader("Content-Range", `bytes */${data.length}`);
          response.end();
          return;
        }
        response.statusCode = 206;
        response.setHeader("Content-Range", `bytes ${start}-${end}/${data.length}`);
        response.setHeader("Content-Length", end - start + 1);
        response.end(request.method === "HEAD" ? undefined : data.subarray(start, end + 1));
        return;
      }
      response.setHeader("Content-Length", data.length);
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
    tailwindcss(),
    commercialReviewAssetPlugin,
    insideMachineLocalAssetsPlugin,
    p5SeasonalLocalAssetsPlugin,
    p5Extended2026LocalAssetsPlugin,
    historicalStandingsLocalAssetsPlugin,
    homeExploreLocalAssetsPlugin,
    miniRaceLocalAssetsPlugin,
    showroomIntroReviewPlugin,
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
