import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CIRCUIT_REVIEW_POINTS } from "../data/championship/circuitReviewPoints";

describe("commercial visual isolation", () => {
  it("routes every circuit checkpoint to an original local EDS visualization", () => {
    const points = Object.values(CIRCUIT_REVIEW_POINTS).flat();
    expect(points).toHaveLength(77);
    for (const point of points) {
      expect(point.imageUrl).toBe(
        `/images/eds/circuits/${point.circuitId}.svg`,
      );
    }
  });

  it("keeps prohibited tile and remote-photo hosts out of active circuit & Storm sources", () => {
    const reviewSource = readFileSync(
      "src/data/championship/circuitReviewPoints.ts",
      "utf8",
    );
    const stormViews = readFileSync(
      "src/components/storm/StormViews.tsx",
      "utf8",
    );
    const combined = `${reviewSource}\n${stormViews}`;
    expect(combined).not.toContain("arcgisonline.com");
    expect(combined).not.toContain("tile.openstreetmap.org");
    expect(combined).not.toContain("images.unsplash.com");
  });

  it("keeps legacy livery, Model B, and sponsor modules outside the production Showroom entry", () => {
    const showroomSource = readFileSync(
      "src/components/storm/routes/StormShowroomRoute.tsx",
      "utf8",
    );
    for (const forbidden of [
      "F1CarTextures",
      "HotspotDetailsModal",
      "LiverySelector",
      "SchematicComparisonModal",
      "StudioBackdropTexture",
      "StudioW15Stage",
      "ModelBShowroom",
      "modelBLoader",
      "teamLiveries",
      "teamLogoSVGs",
      "teamSponsors",
    ]) {
      expect(showroomSource).not.toContain(forbidden);
    }
  });

  it("keeps retired Model B, G02, and G03 models behind the commercial artifact guard", () => {
    const pruneSource = readFileSync(
      "scripts/prune-legacy-showroom-assets.mjs",
      "utf8",
    );
    const isolationSource = readFileSync(
      "scripts/check-commercial-visual-isolation.mjs",
      "utf8",
    );
    for (const model of [
      "/models/model-b-eds-optimized-v1.glb",
      "/models/eds-g02.glb",
      "/models/eds-g03-preview.glb",
    ]) {
      expect(pruneSource).toContain(model.slice(1));
      expect(isolationSource).toContain(model);
    }
  });

  it("serves the FP-04 RB Pit Garage Showroom in production while keeping review & drift media isolated", () => {
    const viteSource = readFileSync("vite.config.ts", "utf8");
    const isolationSource = readFileSync(
      "scripts/check-commercial-visual-isolation.mjs",
      "utf8",
    );
    const homeSource = readFileSync(
      "src/components/storm/StormOverview.tsx",
      "utf8",
    );

    expect(viteSource).not.toContain(".local-assets");
    expect(viteSource).not.toContain("DevAssetPlugin");
    expect(isolationSource).toContain("models/fp04rb-showroom-desktop.glb");
    expect(isolationSource).toContain(
      "29588DA97E49FBECEBB3EA3969149DD8BB00403DA84BCB8FAEAE3F85498D456B",
    );
    expect(isolationSource).toContain("models/fp04rb-showroom-mobile.glb");
    expect(isolationSource).toContain(
      "DF8B7FAACDDB20F16FE1534D1ABD1D0C0A896C7725B1442F184BEB8C174C3DEB",
    );
    for (const forbidden of [
      "hero-h3-2.mp4",
      "hero-h3-2-poster.png",
      "<video",
      "__peds-review",
      "__peds-prototype-assets",
      "eds-g01",
      "ModelB",
    ]) {
      expect(homeSource).not.toContain(forbidden);
    }
  });
});
