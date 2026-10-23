import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { clientAssetsDir, requireHtmlShell } from "./build-paths.mjs";

const wrangler = await readFile("../../wrangler.jsonc", "utf8");
const configuredDirectory = wrangler.match(
  /"assets"\s*:\s*\{[^}]*"directory"\s*:\s*"([^"]+)"/s,
)?.[1];
assert.ok(configuredDirectory, "Wrangler assets.directory is missing");
assert.equal(path.resolve("../..", configuredDirectory), clientAssetsDir);

await requireHtmlShell(path.join(clientAssetsDir, "index.html"));
for (const file of ["robots.txt", "sitemap.xml", "engineering/index.html"]) {
  await access(path.join(clientAssetsDir, file));
}
const articles = JSON.parse(
  await readFile("src/data/engineeringArticles.json", "utf8"),
);
for (const article of articles) {
  await access(
    path.join(clientAssetsDir, "engineering", article.slug, "index.html"),
  );
}

const context =
  process.env.VITE_DEPLOYMENT_CONTEXT ??
  process.env.VERCEL_ENV ??
  process.env.CONTEXT;
const preview = ["preview", "deploy-preview", "branch-deploy"].includes(
  context,
);
const indexingAllowed = Boolean(
  process.env.VITE_SITE_URL &&
  process.env.VITE_ALLOW_INDEXING === "true" &&
  !preview,
);
if (!indexingAllowed) {
  const robots = await readFile(
    path.join(clientAssetsDir, "robots.txt"),
    "utf8",
  );
  assert.match(
    robots,
    /Disallow: \/\s*$/m,
    "Non-production build must disallow indexing",
  );
}

const rootEntries = await readdir("dist");
assert.ok(
  !rootEntries.includes("engineering"),
  "Stale dist/engineering output remains outside client assets",
);
const modelEntries = await readdir(path.join(clientAssetsDir, "models"));
assert.deepEqual(
  modelEntries.filter((entry) => entry.endsWith(".glb")).sort(),
  ["eds-g01.glb"],
);
console.log(
  `Cloudflare build output: PASS (${articles.length} Engineering articles; ${clientAssetsDir}).`,
);
