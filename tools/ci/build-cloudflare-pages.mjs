import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const clientDir = path.resolve(root, "apps/web/dist/client");
const pagesDistDir = path.resolve(root, ".wrangler/pages-dist");
const workerEntry = path.resolve(root, "apps/api/src/worker.ts");

await rm(pagesDistDir, { recursive: true, force: true });
await mkdir(pagesDistDir, { recursive: true });
await cp(clientDir, pagesDistDir, { recursive: true });

await build({
  entryPoints: [workerEntry],
  outfile: path.join(pagesDistDir, "_worker.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  conditions: ["worker", "browser", "module", "default"],
});

const routesManifest = {
  version: 1,
  include: ["/api/*", "/models/*"],
  exclude: [],
};
await writeFile(
  path.join(pagesDistDir, "_routes.json"),
  `${JSON.stringify(routesManifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Cloudflare Pages bundle ready: ${pagesDistDir} (_worker.js + _routes.json)`,
);
