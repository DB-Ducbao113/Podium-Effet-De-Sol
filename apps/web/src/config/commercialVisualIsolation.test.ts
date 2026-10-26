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

  it("keeps prohibited tile and remote-photo hosts out of active circuit source", () => {
    const mapSource = readFileSync(
      "src/components/championship/CircuitRealWorldMap.tsx",
      "utf8",
    );
    const reviewSource = readFileSync(
      "src/data/championship/circuitReviewPoints.ts",
      "utf8",
    );
    const combined = `${mapSource}\n${reviewSource}`;
    expect(combined).not.toContain("arcgisonline.com");
    expect(combined).not.toContain("tile.openstreetmap.org");
    expect(combined).not.toContain("images.unsplash.com");
    expect(combined).not.toContain("/images/circuits/");
  });

  it("keeps legacy livery and sponsor modules outside the production Showroom entry", () => {
    const showroomSource = readFileSync(
      "src/components/showroom/ShowroomView.tsx",
      "utf8",
    );
    for (const forbidden of [
      "'./F1CarTextures'",
      "'./HotspotDetailsModal'",
      "'./LiverySelector'",
      "'./SchematicComparisonModal'",
      "'./StudioBackdropTexture'",
      "'./StudioW15Stage'",
      "'../../data/showroom/teamLiveries'",
      "'../../data/showroom/teamLogoSVGs'",
      "'../../data/showroom/teamSponsors'",
    ]) {
      expect(showroomSource).not.toContain(forbidden);
    }
  });

  it("keeps unapproved G02 and G03 review models behind the commercial artifact guard", () => {
    const pruneSource = readFileSync(
      "scripts/prune-legacy-showroom-assets.mjs",
      "utf8",
    );
    const isolationSource = readFileSync(
      "scripts/check-commercial-visual-isolation.mjs",
      "utf8",
    );
    for (const model of [
      "/models/eds-g02.glb",
      "/models/eds-g03-preview.glb",
    ]) {
      expect(pruneSource).toContain(model.slice(1));
      expect(isolationSource).toContain(model);
    }
  });

  it("keeps the commercial Model B route and frozen local candidate out of production artifacts", () => {
    const viteSource = readFileSync("vite.config.ts", "utf8");
    const showroomSource = readFileSync(
      "src/components/showroom/ShowroomView.tsx",
      "utf8",
    );
    const isolationSource = readFileSync(
      "scripts/check-commercial-visual-isolation.mjs",
      "utf8",
    );

    expect(viteSource).toMatch(/apply:\s*["']serve["']/);
    expect(viteSource).toContain("PEDS_MODEL_B_PATH");
    expect(viteSource).toContain(
      "../../source-assets/models/model-b/model-b-eds-optimized-v1.glb",
    );
    expect(viteSource).toContain(
      "2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2",
    );
    expect(showroomSource).toContain("import.meta.env.DEV");
    expect(showroomSource).toContain('if (import.meta.env.DEV && CommercialBReviewShowroom)');
    expect(showroomSource).not.toContain("requestedModel !== 'eds-g01'");
    for (const token of [
      "/__peds-review/model-b.glb",
      "/__peds-review/tokyo-drift-final.mp4",
      "/__peds-review/tokyo-drift-final-poster.png",
      "/__peds-review/tokyo-drift-h2-9-final.mp4",
      "/__peds-review/tokyo-drift-h2-9-poster.png",
      "/__peds-review/tokyo-drift-h3-0-final.mp4",
      "/__peds-review/tokyo-drift-h3-0-poster.png",
      "/__peds-review/tokyo-drift-h3-1-2x.mp4",
      "/__peds-review/tokyo-drift-h3-1-2x-poster.png",
      "/__peds-review/tokyo-drift-h3-1-3x.mp4",
      "/__peds-review/tokyo-drift-h3-1-3x-poster.png",
      "/__peds-review/tokyo-drift-h3-2-2x.mp4",
      "/__peds-review/tokyo-drift-h3-2-3x.mp4",
      "/__peds-review/tokyo-drift-h3-2-poster.png",
      "/__peds-review/tokyo-drift-h3-2-3x-poster.png",
      "model-b-eds-optimized-v1.glb",
      "tokyo-drift-final.mp4",
      "tokyo-drift-final-poster.png",
      "tokyo-drift-h2-9-final.mp4",
      "tokyo-drift-h2-9-poster.png",
      "tokyo-drift-h3-0-final.mp4",
      "tokyo-drift-h3-0-poster.png",
      "tokyo-drift-h3-1-2x.mp4",
      "tokyo-drift-h3-1-2x-poster.png",
      "tokyo-drift-h3-1-3x.mp4",
      "tokyo-drift-h3-1-3x-poster.png",
      "tokyo-drift-h3-2-2x.mp4",
      "tokyo-drift-h3-2-3x.mp4",
      "tokyo-drift-h3-2-poster.png",
      "tokyo-drift-h3-2-3x-poster.png",
      "commercial-b",
    ]) {
      expect(isolationSource).toContain(token);
    }
  });

  it("keeps Homepage film review-only and does not load its former WebGL scene", () => {
    const heroSource = readFileSync("src/components/home/PodiumBrandHero.tsx", "utf8");
    expect(heroSource).toContain("import.meta.env.DEV");
    expect(heroSource).toContain("/__peds-review/tokyo-drift-h3-2-2x.mp4");
    expect(heroSource).toContain("/__peds-review/tokyo-drift-h3-2-poster.png");
    expect(heroSource).not.toContain("ModelBHomeHeroScene");
    expect(heroSource).toContain("autoPlay");
    expect(heroSource).toContain("playsInline");
    expect(heroSource).toContain("poster=");
    expect(heroSource).not.toContain("loop");
    expect(heroSource).not.toContain("controls");
    expect(heroSource).toContain("onEnded");
    expect(heroSource).toContain("onError");
  });
});
