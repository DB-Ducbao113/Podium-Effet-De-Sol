import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type ProductionFile = {
  group: string;
  publicPath: string;
  publicFile: string;
  sourceFile: string;
  bytes: number;
  sha256: string;
};

type ProductionManifest = {
  title: string;
  release: string;
  releasedAt: string;
  totalFiles: number;
  totalBytes: number;
  files: ProductionFile[];
};

const repoRoot = resolve(process.cwd(), "..", "..");

const manifests: ProductionManifest[] = [
  "seasonal-production.json",
  "extended-2026-production.json",
  "mini-race-production.json",
  "showroom-intro-production.json",
].map(
  (name) =>
    JSON.parse(
      readFileSync(resolve(repoRoot, "docs", "asset-manifests", name), "utf8"),
    ) as ProductionManifest,
);

describe("released owner asset packages", () => {
  it("marks every package as released to production", () => {
    expect(manifests).toHaveLength(4);
    for (const manifest of manifests) {
      expect(manifest.release, manifest.title).toBe("production");
      expect(manifest.releasedAt, manifest.title).toBe("2026-11-10");
      expect(manifest.files).toHaveLength(manifest.totalFiles);
      const bytes = manifest.files.reduce(
        (total, file) => total + file.bytes,
        0,
      );
      expect(bytes, manifest.title).toBe(manifest.totalBytes);
    }
  });

  it("ships every released file byte-identical inside the production public tree", () => {
    for (const manifest of manifests) {
      for (const file of manifest.files) {
        const published = resolve(repoRoot, file.publicFile);
        expect(existsSync(published), file.publicFile).toBe(true);
        expect(statSync(published).size, file.publicFile).toBe(file.bytes);
        const hash = createHash("sha256")
          .update(readFileSync(published))
          .digest("hex");
        expect(hash, file.publicFile).toBe(file.sha256);
      }
    }
  });

  it("never points a released file at the unpublished local asset tree", () => {
    for (const manifest of manifests) {
      for (const file of manifest.files) {
        expect(
          file.sourceFile.startsWith(".local-assets/"),
          file.publicFile,
        ).toBe(true);
        expect(
          file.publicFile.startsWith("apps/web/public/"),
          file.publicFile,
        ).toBe(true);
        expect(
          file.publicFile.endsWith(".local-assets/"),
          file.publicFile,
        ).toBe(false);
      }
    }
  });
});
