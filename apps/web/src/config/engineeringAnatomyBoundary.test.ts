import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Engineering & Showroom route and asset boundary", () => {
  it("registers /engineering/car-anatomy before the /engineering/:slug route", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app.indexOf('path="/engineering/car-anatomy"')).toBeGreaterThan(-1);
    expect(app.indexOf('path="/engineering/car-anatomy"')).toBeLessThan(
      app.indexOf('path="/engineering/:slug"'),
    );
  });

  it("uses owner-approved FP-04 RB production GLB URLs for Engineering and Showroom without DEV leaks or retired Model B", () => {
    const engData = readFileSync(
      "src/components/engineering/engineeringDisassemblyData.ts",
      "utf8",
    );
    const garageLoader = readFileSync(
      "src/components/showroom/fp04rb-garage/fp04rbLoader.ts",
      "utf8",
    );
    expect(engData).toContain("/models/fp04rb-engineering-v1.glb");
    expect(engData).not.toContain("/__peds-");
    expect(garageLoader).toContain("/models/fp04rb-showroom-desktop.glb");
    expect(garageLoader).toContain("/models/fp04rb-showroom-mobile.glb");
    expect(garageLoader).not.toContain("model-b");
  });
});
