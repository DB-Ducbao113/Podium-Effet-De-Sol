import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StormHeroBackdrop } from "./StormHeroBackdrop";
import { StormVisualImage } from "./StormVisualImage";
import { resolveStormVisualAsset } from "./stormVisualAssets";

const repoRoot = resolve(process.cwd(), "..", "..");
const RAW_STORM_JPG_BASELINE_BYTES = 320_234 + 229_471; // 549,705 B

describe("Plan 1 — Public Storm & Seasonal Asset Promotion (US-01)", () => {
  it("AC-01.1 & SEC-REQ-07: publishes storm-cutover-production.json with 100% SHA-256 verified files in apps/web/public/images/", () => {
    const manifestPath = resolve(
      repoRoot,
      "docs/asset-manifests/storm-cutover-production.json",
    );
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      release: string;
      totalFiles: number;
      totalBytes: number;
      files: Array<{
        publicFile: string;
        sourceFile: string;
        bytes: number;
        sha256: string;
      }>;
    };
    expect(manifest.release).toBe("production");
    expect(manifest.files.length).toBeGreaterThanOrEqual(103); // 12 responsive Storm plates + 91 seasonal WebPs
    expect(manifest.files).toHaveLength(manifest.totalFiles);

    let sumBytes = 0;
    for (const entry of manifest.files) {
      expect(entry.sourceFile.startsWith(".local-assets/")).toBe(true);
      expect(entry.publicFile.startsWith("apps/web/public/images/")).toBe(true);
      const abs = resolve(repoRoot, entry.publicFile);
      expect(existsSync(abs), entry.publicFile).toBe(true);
      expect(statSync(abs).size, entry.publicFile).toBe(entry.bytes);
      const digest = createHash("sha256")
        .update(readFileSync(abs))
        .digest("hex");
      expect(digest, entry.publicFile).toBe(entry.sha256);
      sumBytes += entry.bytes;
    }
    expect(sumBytes).toBe(manifest.totalBytes);
  });

  it("AC-01.4 (BR-03): responsive AVIF & WebP Storm backdrops achieve >= 40% transfer byte reduction vs raw 549,705 B JPG baseline", () => {
    const desktopPairAvif =
      statSync(
        resolve(repoRoot, "apps/web/public/images/storm/storm-hero-1600.avif"),
      ).size +
      statSync(
        resolve(repoRoot, "apps/web/public/images/storm/storm-tabs-1600.avif"),
      ).size;
    const mobilePairWebp =
      statSync(
        resolve(repoRoot, "apps/web/public/images/storm/storm-hero-960.webp"),
      ).size +
      statSync(
        resolve(repoRoot, "apps/web/public/images/storm/storm-tabs-960.webp"),
      ).size;

    expect(desktopPairAvif).toBeLessThanOrEqual(
      Math.floor(RAW_STORM_JPG_BASELINE_BYTES * 0.6),
    );
    expect(mobilePairWebp).toBeLessThanOrEqual(
      Math.floor(RAW_STORM_JPG_BASELINE_BYTES * 0.6),
    );
  });

  it("AC-01.1: resolves 2024, 2025, and 2026 cars, drivers, teams, and heroes strictly from /images/ with zero /__peds-prototype-assets URLs", () => {
    const samples = [
      resolveStormVisualAsset("car", 2024, "mclaren"),
      resolveStormVisualAsset("driver", 2024, "norris"),
      resolveStormVisualAsset("team", 2024, "ferrari"),
      resolveStormVisualAsset("hero", 2024, "championship"),
      resolveStormVisualAsset("car", 2025, "mclaren"),
      resolveStormVisualAsset("driver", 2025, "verstappen"),
      resolveStormVisualAsset("car", 2026, "mclaren"),
      resolveStormVisualAsset("driver", 2026, "norris"),
    ];
    for (const asset of samples) {
      expect(asset.src).toBeDefined();
      expect(asset.src?.startsWith("/images/")).toBe(true);
      expect(asset.src).not.toContain("__peds-prototype-assets");
    }
  });

  it("AC-01.2 & AC-01.5: omits draft REVIEW ONLY stamps on card faces and renders clean fallback when entity is missing", () => {
    const cardHtml = renderToStaticMarkup(
      <StormVisualImage
        kind="driver"
        season={2025}
        entityId="norris"
        alt="Lando Norris 2025"
        className="sp-lg-driver-art"
        placeholder="#4"
      />,
    );
    expect(cardHtml).toContain("/images/concepts-2025/drivers/norris.webp");
    expect(cardHtml).not.toContain("REVIEW ONLY");
    expect(cardHtml).not.toContain("AI CONCEPT");
    expect(cardHtml).not.toContain("OWNER CONCEPT");

    const fallbackHtml = renderToStaticMarkup(
      <StormVisualImage
        kind="driver"
        season={2026}
        entityId="nonexistent-driver-id"
        alt="Missing Driver"
        className="sp-lg-driver-art"
        placeholder="#99"
      />,
    );
    expect(fallbackHtml).toContain("sp-visual-placeholder");
    expect(fallbackHtml).toContain("#99");
  });

  it("AC-01.1 & AC-01.4: StormHeroBackdrop renders responsive <picture> AVIF/WebP sources in SSR/production mode without DEV-only gating", () => {
    const heroHtml = renderToStaticMarkup(
      <StormHeroBackdrop reducedMotion={true} variant="hero" />,
    );
    expect(heroHtml).toContain("/images/storm/storm-hero-1600.avif");
    expect(heroHtml).toContain("/images/storm/storm-hero-1600.webp");
    expect(heroHtml).toContain('fetchpriority="high"');
    expect(heroHtml).not.toContain("__peds-prototype-assets");
  });
});
