import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const target = process.cwd();
const source = process.argv[2];
if (!source || !fs.existsSync(path.join(source, ".git"))) {
  throw new Error(
    "Usage: node tools/generate-migration-manifests.mjs <source-worktree>",
  );
}

function gitFiles(repository) {
  return execFileSync(
    "git",
    ["-C", repository, "ls-files", "-co", "--exclude-standard"],
    {
      encoding: "utf8",
    },
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
}

function describe(repository, relative) {
  const absolute = path.join(repository, relative);
  const metadata = fs.lstatSync(absolute);
  if (metadata.isSymbolicLink()) {
    throw new Error(
      `Symbolic links are not permitted in the upload allowlist: ${relative}`,
    );
  }
  if (!metadata.isFile()) {
    throw new Error(
      `Only regular files are permitted in the upload allowlist: ${relative}`,
    );
  }
  const body = fs.readFileSync(absolute);
  return {
    path: relative.split(path.sep).join("/"),
    bytes: body.length,
    sha256: crypto
      .createHash("sha256")
      .update(body)
      .digest("hex")
      .toUpperCase(),
  };
}

function reasonFor(relative) {
  const normalized = relative.split(path.sep).join("/");
  if (normalized.startsWith(".github/workflows/"))
    return "Least-privilege verification workflow";
  if (normalized === ".env.example")
    return "Non-secret local configuration template";
  if (normalized === ".gitignore" || normalized === ".prettierignore") {
    return "Repository hygiene configuration";
  }
  if (normalized === "package.json" || normalized === "package-lock.json") {
    return "Pinned npm workspace dependency and script configuration";
  }
  if (
    normalized === "eslint.config.js" ||
    normalized === "tsconfig.base.json" ||
    normalized === "wrangler.jsonc"
  ) {
    return "Build, type, lint, or Cloudflare runtime configuration";
  }
  if (normalized === "README.md" || normalized.startsWith("docs/")) {
    return "Repository architecture, security, migration, or operating documentation";
  }
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(normalized)) {
    return "Automated functional, security, or regression test";
  }
  if (normalized.startsWith("apps/api/"))
    return "Cloudflare Worker API runtime source or package config";
  if (normalized.startsWith("apps/jobs/"))
    return "Manual data synchronization source or package config";
  if (normalized === "apps/web/public/models/eds-g01.glb") {
    return "Approved production runtime 3D asset (EDS-G01; Model B excluded)";
  }
  if (normalized.startsWith("apps/web/public/"))
    return "Approved public runtime asset or metadata";
  if (normalized.startsWith("apps/web/src/dev/")) {
    return "Development-only Model B loader or adaptive graphics source";
  }
  if (normalized.startsWith("apps/web/"))
    return "Frontend runtime source, data, or build config";
  if (normalized.startsWith("packages/contracts/"))
    return "Shared API contract source or package config";
  if (normalized.startsWith("packages/security/"))
    return "Shared security source or package config";
  if (normalized.startsWith("tools/"))
    return "Local and CI verification tooling";
  throw new Error(`No upload justification is defined for: ${normalized}`);
}

function inventory(repository) {
  const files = gitFiles(repository).map((file) => describe(repository, file));
  return {
    root: repository,
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    files,
  };
}

fs.mkdirSync(path.join(target, "scratch", "plan-d"), { recursive: true });
const sourceInventory = inventory(source);
fs.writeFileSync(
  path.join(target, "scratch", "plan-d", "source-manifest.json"),
  `${JSON.stringify(sourceInventory, null, 2)}\n`,
);

const allowlistPath = "docs/upload-allowlist.txt";
const targetFiles = gitFiles(target).filter((file) => file !== allowlistPath);
targetFiles.push(allowlistPath);
targetFiles.sort();
const allowlist = [
  "# Plan D upload allowlist",
  "# Exact repository-relative paths. Local ignored files are intentionally absent.",
  ...targetFiles,
  "",
].join("\n");
fs.writeFileSync(path.join(target, allowlistPath), allowlist);

const targetInventory = inventory(target);
fs.writeFileSync(
  path.join(target, "scratch", "plan-d", "target-manifest.json"),
  `${JSON.stringify(targetInventory, null, 2)}\n`,
);

const d8Directory = path.join(target, "scratch", "plan-d", "d8-readiness");
fs.mkdirSync(d8Directory, { recursive: true });
const d8Inventory = {
  ...targetInventory,
  generatedAt: new Date().toISOString(),
  files: targetInventory.files.map((file) => ({
    ...file,
    reason: reasonFor(file.path),
  })),
};
fs.writeFileSync(
  path.join(d8Directory, "upload-manifest.json"),
  `${JSON.stringify(d8Inventory, null, 2)}\n`,
);
const manifestRows = d8Inventory.files.map(
  (file) =>
    `| \`${file.path}\` | ${file.bytes} | \`${file.sha256}\` | ${file.reason} |`,
);
fs.writeFileSync(
  path.join(d8Directory, "upload-manifest-files.md"),
  [
    "# D8 Exact Upload Manifest",
    "",
    `Generated: ${d8Inventory.generatedAt}`,
    "",
    `Files: ${d8Inventory.fileCount}`,
    "",
    `Total bytes: ${d8Inventory.totalBytes}`,
    "",
    "| Path | Bytes | SHA-256 | Reason |",
    "| --- | ---: | --- | --- |",
    ...manifestRows,
    "",
  ].join("\n"),
);

console.log(
  JSON.stringify(
    {
      source: {
        files: sourceInventory.fileCount,
        bytes: sourceInventory.totalBytes,
      },
      target: {
        files: targetInventory.fileCount,
        bytes: targetInventory.totalBytes,
      },
      allowlistEntries: targetFiles.length,
    },
    null,
    2,
  ),
);
