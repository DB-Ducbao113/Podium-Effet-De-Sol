import { describe, expect, it } from "vitest";
import { AdaptiveQualityController } from "./model-b/adaptiveController";
import {
  FP04RB_ADAPTIVE_QUALITY_CONFIG,
  getFp04rbCameraDistanceScale,
  getFp04rbHotspotDistanceFactor,
  getFp04rbRenderScale,
  getFp04rbVisibleHotspots,
  isFp04rbInteractionActive,
  shouldEnableFp04rbAntialias,
} from "./fp04rbGraphics";

describe("fp04rb render scale", () => {
  it("starts AUTO at balanced scale and adapts within the desktop cap", () => {
    expect(getFp04rbRenderScale("AUTO", "BALANCED", 1440)).toBe(1.25);
    expect(getFp04rbRenderScale("AUTO", "PERFORMANCE", 1440)).toBe(1);
    expect(getFp04rbRenderScale("AUTO", "HIGH", 1440)).toBe(1.6);
  });

  it("uses the planned AUTO scale on desktop and caps narrow viewports", () => {
    expect(getFp04rbRenderScale("AUTO", "BALANCED", 1440)).toBe(1.25);
    expect(getFp04rbRenderScale("AUTO", "HIGH", 390)).toBe(1.25);
  });

  it("preserves explicit graphics mode caps", () => {
    expect(getFp04rbRenderScale("HIGH", "HIGH", 1440)).toBe(1.75);
    expect(getFp04rbRenderScale("BALANCED", "BALANCED", 1440)).toBe(1.25);
    expect(getFp04rbRenderScale("PERFORMANCE", "PERFORMANCE", 1440)).toBe(0.67);
  });

  it("samples frame metrics only while an interaction is moving", () => {
    expect(isFp04rbInteractionActive(1_400, 1_000)).toBe(true);
    expect(isFp04rbInteractionActive(1_500, 1_000)).toBe(false);
    expect(isFp04rbInteractionActive(900, 1_000)).toBe(false);
  });

  it("degrades AUTO with fewer valid frames when sustained performance is slow", () => {
    const controller = new AdaptiveQualityController(
      0,
      "BALANCED",
      FP04RB_ADAPTIVE_QUALITY_CONFIG,
    );
    controller.resetAuto(0, "BALANCED");

    for (const nowMs of [1_000, 2_000, 3_000]) {
      controller.ingest({
        nowMs,
        averageFps: 12,
        frameTimeP95Ms: 120,
        refreshRateHz: 60,
        validFrameCount: 24,
        continuous: true,
      });
    }

    expect(controller.getState().profile).toBe("PERFORMANCE");
  });
});

describe("fp04rb antialias quality policy", () => {
  it("reserves multisample antialiasing for fixed HIGH mode", () => {
    expect(shouldEnableFp04rbAntialias("HIGH")).toBe(true);
    expect(shouldEnableFp04rbAntialias("AUTO")).toBe(false);
    expect(shouldEnableFp04rbAntialias("BALANCED")).toBe(false);
    expect(shouldEnableFp04rbAntialias("PERFORMANCE")).toBe(false);
  });
});

describe("fp04rb responsive camera framing", () => {
  it("backs the full-car presets away on narrow viewports", () => {
    expect(getFp04rbCameraDistanceScale(1440)).toBe(1);
    expect(getFp04rbCameraDistanceScale(640)).toBe(1.35);
    expect(getFp04rbCameraDistanceScale(390)).toBe(1.7);
  });

  it("keeps a close cockpit view on narrow viewports", () => {
    expect(getFp04rbCameraDistanceScale(1440, true)).toBe(1);
    expect(getFp04rbCameraDistanceScale(390, true)).toBe(1.15);
  });

  it("keeps cockpit hotspot markers small enough to avoid covering the cabin", () => {
    expect(getFp04rbHotspotDistanceFactor(true)).toBeLessThanOrEqual(3);
    expect(getFp04rbHotspotDistanceFactor(false)).toBeGreaterThanOrEqual(6);
  });
});

describe("fp04rb cockpit hotspot clarity", () => {
  const hotspots = [
    { id: "front-wing", preset: "front" },
    { id: "seat", preset: "cockpit" },
    { id: "dashboard", preset: "cockpit" },
  ] as const;

  it("keeps unrelated markers out of the empty cockpit close-up", () => {
    expect(getFp04rbVisibleHotspots(hotspots, "cockpit", null)).toEqual([]);
    expect(getFp04rbVisibleHotspots(hotspots, "cockpit", hotspots[1])).toEqual([
      hotspots[1],
    ]);
  });

  it("keeps all feature markers in the exterior views", () => {
    expect(getFp04rbVisibleHotspots(hotspots, "overview", null)).toBe(hotspots);
  });
});
