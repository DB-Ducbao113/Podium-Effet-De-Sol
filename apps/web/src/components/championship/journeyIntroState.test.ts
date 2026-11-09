import { describe, expect, it } from "vitest";
import { getJourneyIntroTier } from "./journeyIntroState";

describe("journey device tier", () => {
  const base = {
    webglAvailable: true,
    reducedMotion: false,
    saveData: false,
  };

  it("falls back to T0 without WebGL or with reduced motion / save-data / 2g", () => {
    expect(getJourneyIntroTier({ ...base, webglAvailable: false })).toBe("T0");
    expect(getJourneyIntroTier({ ...base, saveData: true })).toBe("T0");
    expect(getJourneyIntroTier({ ...base, effectiveType: "2g" })).toBe("T0");
    expect(getJourneyIntroTier({ ...base, reducedMotion: true })).toBe("T0");
  });

  it("selects T1 for low-memory or low-core devices, T3 for high-end, T2 otherwise", () => {
    expect(getJourneyIntroTier({ ...base, deviceMemory: 4 })).toBe("T1");
    expect(
      getJourneyIntroTier({ ...base, deviceMemory: 8, hardwareConcurrency: 8 }),
    ).toBe("T3");
    expect(getJourneyIntroTier(base)).toBe("T2");
  });
});