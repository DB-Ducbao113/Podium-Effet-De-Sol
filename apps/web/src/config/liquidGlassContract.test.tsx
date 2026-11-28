import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LiquidGlassFilterDefs } from "../components/common/LiquidGlassFilterDefs";
import { buildLiquidBezelMapDataUri } from "../components/common/liquidGlassRefraction";

describe("True Optical Liquid Glass Contract (SVG Refraction + Fresnel Rim, Zero Flat Heavy Blur)", () => {
  it("generates a deterministic convex bezel SVG displacement map with a neutral optical center", () => {
    const uri = buildLiquidBezelMapDataUri({
      bezelXPercent: 14,
      bezelYPercent: 28,
    });
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    const decoded = decodeURIComponent(uri.slice("data:image/svg+xml,".length));
    expect(decoded).toContain("rgb(128,0,0)");
    expect(decoded).toContain("rgb(0,128,0)");
    expect(decoded).toContain("rgb(255,0,0)");
    expect(decoded).toContain("rgb(0,255,0)");
    expect(decoded).toContain("mix-blend-mode:screen");
  });

  it("renders inline SVG optical refraction filters with feDisplacementMap and chromatic RGB channel dispersion", () => {
    const html = renderToStaticMarkup(<LiquidGlassFilterDefs />);
    expect(html).toContain('id="peds-liquid-refract-pill"');
    expect(html).toContain('id="peds-liquid-refract-panel"');
    expect(html).toContain('id="peds-liquid-refract-drawer"');
    expect(html).toContain("feDisplacementMap");
    expect(html).toContain("feColorMatrix");
    expect(html).toContain("feImage");
    expect(html).toContain('aria-hidden="true"');
  });

  it("wires LiquidGlassFilterDefs and liquidGlass.css globally and replaces legacy heavy flat CSS blur across Storm, Nav, Showroom, and Sandbox", () => {
    const appSrc = readFileSync("src/App.tsx", "utf8");
    expect(appSrc).toContain("LiquidGlassFilterDefs");

    const mainSrc = readFileSync("src/main.tsx", "utf8");
    expect(mainSrc).toContain("./styles/liquidGlass.css");

    const liquidCss = readFileSync("src/styles/liquidGlass.css", "utf8");
    expect(liquidCss).toContain("url(#peds-liquid-refract-pill)");
    expect(liquidCss).toContain("url(#peds-liquid-refract-panel)");
    expect(liquidCss).toContain("url(#peds-liquid-refract-drawer)");

    for (const file of [
      "src/components/layout/navigation/liquidGlassNav.css",
      "src/components/storm/stormShell.css",
      "src/components/engineering-lab/engineeringLabLuxury.css",
      "src/components/engineering/engineeringStudio.css",
      "src/components/showroom/fp04rb-garage/showroomGarage.css",
    ]) {
      const css = readFileSync(file, "utf8");
      expect(css).toContain("--peds-lg-backdrop-");
      // Must not leave heavy opaque frosted glass blur(14px..28px) on active surfaces
      expect(css).not.toMatch(/backdrop-filter\s*:\s*(?:saturate\([^)]+\)\s*)?blur\((?:1[4-9]|2\d)px\)/i);
    }
  });
});
