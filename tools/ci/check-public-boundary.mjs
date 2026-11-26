import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const forbiddenDirectories = ["docs/visual-feedback", "apps/web/public/media"];
const forbiddenExtensions = new Set([
  ".blend",
  ".blend1",
  ".mp4",
  ".webm",
  ".zip",
  ".7z",
]);
const approvedPublicModels = new Map([
  [
    "apps/web/public/models/fp04rb-engineering-v1.glb",
    "16CD7B971B4C86C41CBBA3CE192F015AAAB3335CE24A68F1E58E891B1A4D5526",
  ],
  [
    "apps/web/public/models/fp04rb-showroom-desktop.glb",
    "29588DA97E49FBECEBB3EA3969149DD8BB00403DA84BCB8FAEAE3F85498D456B",
  ],
  [
    "apps/web/public/models/fp04rb-showroom-mobile.glb",
    "DF8B7FAACDDB20F16FE1534D1ABD1D0C0A896C7725B1442F184BEB8C174C3DEB",
  ],
  [
    "apps/web/public/models/fp04rb-pit-crew-v1.glb",
    "72D12470F37C24584286FAB3CB31EA28E81EF3FADE510218217DC9BAECC7CFAF",
  ],
]);
const frozenSourceAssets = new Map([
  [
    "source-assets/models/model-b/model-b-eds-optimized-v1.glb",
    "2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2",
  ],
  [
    "source-assets/models/inside-the-machine/authoring/r4-4-a/model-b-cinematic-r4-4-a.blend",
    "9F7E9BF5AFB4134AFA927C56F99F56AEE6DCD3E44382EAAF6189A03BB351D61E",
  ],
  [
    "source-assets/models/inside-the-machine/authoring/r4-4-b/model-b-cinematic-r4-4-b.blend",
    "FDDDD578CC616B770A106D3C3C649F77ABDCD7C30947DFEA36598C76BB666622",
  ],
  [
    "source-assets/models/inside-the-machine/authoring/r4-4-c/model-b-cinematic-r4-4-c.blend",
    "9AC88991BE50C65B069B61D81FC418986D38E9831BFF40FAAA6BFC27432B95ED",
  ],
  [
    "source-assets/models/inside-the-machine/authoring/r4-5/model-b-cinematic-r4-5.blend",
    "EADE97FB48985C430173858C47B2C1225DE9DEB78E77A445C16F2B4ACA4A9563",
  ],
  [
    "source-assets/models/inside-the-machine/exports/model-b-cinematic-r4-5-balanced.glb",
    "A1C8E39B6B22299FC8ED48617888B483FCC72276B570783AC5538E1E4A2A4EB3",
  ],
  [
    "source-assets/models/inside-the-machine/exports/model-b-cinematic-r4-5-high.glb",
    "2AF5B57AB3E77C921840DD9A351FFF0D8A0164644E5C21F3A376BFF19207E705",
  ],
  [
    "source-assets/models/inside-the-machine/exports/model-b-cinematic-r4-5-performance.glb",
    "B42021335B3B3140ACB98705DC417A633578B1D2A50B78C3864052FBD9BF3496",
  ],
]);
const violations = [];

function normalize(value) {
  return value.split(path.sep).join("/");
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === ".git" ||
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".local-assets" ||
      entry.name === "scratch" ||
      entry.name === "references" ||
      entry.name === "archives"
    )
      continue;
    const absolute = path.join(directory, entry.name);
    const relative = normalize(path.relative(root, absolute));
    if (entry.isDirectory()) {
      if (forbiddenDirectories.includes(relative)) violations.push(relative);
      else walk(absolute);
    } else {
      const extension = path.extname(entry.name).toLowerCase();
      const approvedModelHash = approvedPublicModels.get(relative);
      if (approvedModelHash && extension === ".glb") {
        const actualHash = crypto
          .createHash("sha256")
          .update(fs.readFileSync(absolute))
          .digest("hex")
          .toUpperCase();
        if (actualHash !== approvedModelHash)
          violations.push(`${relative} (SHA-256 mismatch)`);
        continue;
      }
      const frozenHash = frozenSourceAssets.get(relative);
      if (frozenHash && (extension === ".glb" || extension === ".blend")) {
        const actualHash = crypto
          .createHash("sha256")
          .update(fs.readFileSync(absolute))
          .digest("hex")
          .toUpperCase();
        if (actualHash !== frozenHash)
          violations.push(`${relative} (SHA-256 mismatch)`);
      } else {
        if (forbiddenExtensions.has(extension) || extension === ".glb")
          violations.push(relative);
      }
    }
  }
}

walk(root);
if (violations.length) {
  console.error(
    `Public boundary violations:\n${[...new Set(violations)].join("\n")}`,
  );
  process.exit(1);
}
console.log("Public asset boundary: PASS");
