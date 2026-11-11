import { describe, expect, it } from "vitest";
import identity from "./asset-identity.json";
import { ASSET_URLS, MANIFEST_URL, POSTER_URL } from "./assetPaths";
import {
  assemblyDetachmentAt,
  CHAPTERS,
  componentDetachmentAt,
  evaluateExplanationTimeline,
  poseAt,
  progressForChapter,
} from "./storyboard";

describe("Inside the Machine chapter navigation", () => {
  it("lands inside each selected chapter after browser scroll-position rounding", () => {
    const scrollRange = 46 * 900 - 900;
    CHAPTERS.forEach((chapter, index) => {
      const target = progressForChapter(index);
      const rounded = Math.floor(target * scrollRange) / scrollRange;
      expect(poseAt(rounded).chapterIndex, chapter.id).toBe(index);
    });
    expect(progressForChapter(0)).toBe(0);
  });

  it("binds R5 CAD-to-Blender-to-GLB asset identity with SHA-256 verification", () => {
    expect(identity.namespace).toBe("set-bd4461602472a18a");
    expect(identity.sourceSha256).toBe(
      "2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2",
    );
    expect(identity.assets.manifest.sourceRelative).toBe(
      "assembly-manifest-r5.json",
    );
    expect(identity.assets.HIGH.sourceRelative).toBe(
      "optimized/model-b-cinematic-r5-high.meshopt.glb",
    );
    expect(identity.assets.BALANCED.sourceRelative).toBe(
      "optimized/model-b-cinematic-r5-balanced.meshopt.glb",
    );
    expect(identity.assets.PERFORMANCE.sourceRelative).toBe(
      "optimized/model-b-cinematic-r5-performance.meshopt.glb",
    );
    expect(MANIFEST_URL).toContain(`/set-bd4461602472a18a/manifest-`);
    expect(ASSET_URLS.HIGH).toContain(`/set-bd4461602472a18a/high-`);
    expect(ASSET_URLS.BALANCED).toContain(`/set-bd4461602472a18a/balanced-`);
    expect(ASSET_URLS.PERFORMANCE).toContain(
      `/set-bd4461602472a18a/performance-`,
    );
    expect(POSTER_URL).toContain(`/set-bd4461602472a18a/poster-`);
  });

  it("drives explanation stagger via scrubbable Anime.js v4 timeline and guarantees zero-drift reassembly", () => {
    const atZero = evaluateExplanationTimeline(0, false);
    expect(atZero.titleProgress).toBe(0);
    expect(atZero.summaryProgress).toBe(0);
    expect(atZero.functionProgress).toBe(0);
    expect(atZero.sourceProgress).toBe(0);

    const atMid = evaluateExplanationTimeline(0.5, false);
    expect(atMid.titleProgress).toBe(1);
    expect(atMid.summaryProgress).toBeGreaterThan(0.8);
    expect(atMid.functionProgress).toBeGreaterThan(0.2);

    const atFull = evaluateExplanationTimeline(1, false);
    expect(atFull.titleProgress).toBe(1);
    expect(atFull.summaryProgress).toBe(1);
    expect(atFull.functionProgress).toBe(1);
    expect(atFull.sourceProgress).toBe(1);
    expect(atFull.titleBlockProgress).toBe(1);

    const reducedAtZero = evaluateExplanationTimeline(0, true);
    expect(reducedAtZero.titleProgress).toBe(0);
    expect(reducedAtZero.titleBlockProgress).toBe(1);

    const backToZero = evaluateExplanationTimeline(0, false);
    expect(backToZero.titleProgress).toBe(0);
    expect(backToZero.summaryProgress).toBe(0);
    expect(backToZero.functionProgress).toBe(0);
    expect(backToZero.sourceProgress).toBe(0);

    const probeAssemblies = [
      "FRONT_LEFT_WHEEL",
      "FRONT_WING",
      "LEFT_SIDEPOD",
      "FLOOR_DIFFUSER",
    ];
    for (const id of probeAssemblies) {
      expect(assemblyDetachmentAt(0, id), id).toBe(0);
      expect(assemblyDetachmentAt(0.75, id), id).toBe(1);
      expect(assemblyDetachmentAt(1, id), id).toBe(0);
    }

    // Forward vs reverse symmetry at identical progress points
    const midForward = assemblyDetachmentAt(0.075, "FRONT_LEFT_WHEEL");
    assemblyDetachmentAt(1, "FRONT_LEFT_WHEEL");
    const midReverse = assemblyDetachmentAt(0.075, "FRONT_LEFT_WHEEL");
    expect(Math.abs(midForward - midReverse)).toBeLessThan(1e-6);

    // Manifest disassemblyWindow + explodeOrder stagger: earlier part detaches first
    const nutEarly = componentDetachmentAt(
      0.072,
      "FRONT_LEFT_WHEEL",
      0,
      7,
      [0, 0.36],
    );
    const hubLater = componentDetachmentAt(
      0.072,
      "FRONT_LEFT_WHEEL",
      2,
      7,
      [0.24, 0.6],
    );
    expect(nutEarly).toBeGreaterThan(hubLater);

    expect(componentDetachmentAt(0, "FRONT_LEFT_WHEEL", 1, 7, [0, 0.36])).toBe(
      0,
    );
    expect(componentDetachmentAt(1, "FRONT_LEFT_WHEEL", 1, 7, [0, 0.36])).toBe(
      0,
    );
  });
});
