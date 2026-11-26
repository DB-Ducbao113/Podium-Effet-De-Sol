import { describe, expect, it } from "vitest";
import { routeCopy } from "./routeCopy";
import { normalizeRoutePath } from "./routePath";

describe("Showroom route metadata", () => {
  it("names the FP-04 RB 3D Garage accurately in both languages without retired Model B claims", () => {
    expect(routeCopy("/showroom", "en").title).toContain("FP-04 RB");
    expect(routeCopy("/showroom", "vi").description).toContain("FP-04 RB");
    expect(routeCopy("/", "en").description).not.toContain("Model B");
  });
});

describe("Prerendered route metadata", () => {
  it("uses the same canonical route with or without a directory trailing slash", () => {
    expect(normalizeRoutePath("/engineering/")).toBe("/engineering");
    expect(normalizeRoutePath("/engineering/ground-effect-aerodynamics/")).toBe(
      "/engineering/ground-effect-aerodynamics",
    );
    expect(normalizeRoutePath("/")).toBe("/");
  });
});
