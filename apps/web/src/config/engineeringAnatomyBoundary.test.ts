import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("F3 route and asset boundary", () => {
  it("registers anatomy and DEV inside-the-machine routes before the article slug route", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app.indexOf('path="/engineering/car-anatomy"')).toBeLessThan(
      app.indexOf('path="/engineering/:slug"'),
    );
    expect(
      app.indexOf('path="/engineering/inside-the-machine"'),
    ).toBeGreaterThan(-1);
    expect(app.indexOf('path="/engineering/inside-the-machine"')).toBeLessThan(
      app.indexOf('path="/engineering/:slug"'),
    );
  });

  it("uses owner-approved production GLB URLs for Engineering and Showroom without DEV leaks", () => {
    const engData = readFileSync(
      "src/components/engineering/engineeringDisassemblyData.ts",
      "utf8",
    );
    const anatomyPage = readFileSync(
      "src/components/engineering/EngineeringAnatomyPage.tsx",
      "utf8",
    );
    const loader = readFileSync(
      "src/components/showroom/model-b/modelBLoader.ts",
      "utf8",
    );
    expect(engData).toContain("/models/fp04rb-engineering-v1.glb");
    expect(engData).not.toContain("/__peds-");
    expect(anatomyPage).toContain("EngineeringIndexPage");
    expect(loader).not.toContain("/__peds-review/model-b.glb");
    expect(loader).toContain("/models/model-b-eds-optimized-v1.glb");
  });
});
