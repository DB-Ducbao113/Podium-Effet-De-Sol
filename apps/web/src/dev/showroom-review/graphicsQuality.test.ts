import { describe, expect, it } from "vitest";
import { resolveGraphicsQuality } from "./graphicsQuality";

describe("Showroom graphics quality", () => {
  it("keeps Auto balanced on hardware and protects software renderers", () => {
    expect(resolveGraphicsQuality("auto", false)).toEqual({
      effective: "balanced",
      dpr: [1, 1.25],
      lowPower: false,
    });
    expect(resolveGraphicsQuality("auto", true)).toEqual({
      effective: "performance",
      dpr: 0.65,
      lowPower: true,
    });
    expect(resolveGraphicsQuality("high", true).effective).toBe("performance");
  });

  it("changes render resolution and expensive effects with the chosen mode", () => {
    expect(resolveGraphicsQuality("high", false)).toEqual({
      effective: "high",
      dpr: [1, 1.5],
      lowPower: false,
    });
    expect(resolveGraphicsQuality("balanced", false)).toEqual({
      effective: "balanced",
      dpr: [1, 1.25],
      lowPower: false,
    });
    expect(resolveGraphicsQuality("performance", false)).toEqual({
      effective: "performance",
      dpr: 0.65,
      lowPower: true,
    });
  });
});
