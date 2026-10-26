import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("F3 route and asset boundary", () => {
  it("registers anatomy before the article slug route", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    expect(app.indexOf('path="/engineering/car-anatomy"')).toBeLessThan(
      app.indexOf('path="/engineering/:slug"'),
    );
  });

  it("keeps Model B viewer DEV-only and outside public assets", () => {
    const page = readFileSync(
      "src/components/engineering/EngineeringAnatomyPage.tsx",
      "utf8",
    );
    const loader = readFileSync("src/dev/commercial-b/modelBLoader.ts", "utf8");
    expect(page).toContain("import.meta.env.DEV");
    expect(loader).toContain("/__peds-review/model-b.glb");
    expect(loader).not.toContain("/models/");
  });
});
