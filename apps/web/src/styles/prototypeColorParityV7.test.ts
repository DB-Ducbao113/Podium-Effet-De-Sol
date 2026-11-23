import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The design specification is the owner-supplied
 * PEDS_CINEMATIC_PROTOTYPE_V5(1).html, not the older global IGNITION tokens.
 * Do not change Showroom / Engineering while the other pages are ported.
 */
const file = (path: string) => readFileSync("src/" + path, "utf8");
const css = file("styles/prototypeColorParityV7.css");
const compactCss = css.replace(/\s+/g, "").replace(/["']/g, "");
const unquotedCss = css.replace(/["']/g, "");
const main = file("main.tsx");
const nav = file("components/layout/Navbar.tsx");
const cssHas = (fragment: string) =>
  compactCss.includes(fragment.replace(/[\s"']/g, ""));
const cssHasSelector = (selector: string) =>
  new RegExp(
    selector
      .replace(/["']/g, "")
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+"),
  ).test(unquotedCss);

const hexValue = (hex: string) => {
  const srgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return srgb
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((v, c, i) => v + c * [0.2126, 0.7152, 0.0722][i], 0);
};
const contrast = (a: string, b: string) => {
  const [high, low] = [hexValue(a), hexValue(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

describe("PEDS V7 prototype colour parity — scoped design system", () => {
  it("publishes all eight canonical V5 tokens with literal original values", () => {
    const expected = {
      night: "#121514",
      "night-deep": "#0b0f0e",
      "driver-field": "#151b19",
      paper: "#efede7",
      "paper-deep": "#e4e0d8",
      white: "#f7f5ef",
      ink: "#171b19",
      accent: "#d16a49",
    } as const;
    for (const [name, hex] of Object.entries(expected)) {
      expect(cssHas("--peds-proto-" + name + ":" + hex)).toBe(true);
    }
    expect(contrast("#efede7", "#171b19")).toBeGreaterThan(14);
    expect(contrast("#121514", "#f7f5ef")).toBeGreaterThan(14);
  });

  it("is imported after V6 and never redefines global legacy IGNITION tokens", () => {
    const v6 = main.indexOf("destinationGridV6.css");
    const v7 = main.indexOf("prototypeColorParityV7.css");
    expect(v6).toBeGreaterThan(-1);
    expect(v7).toBeGreaterThan(v6);
    expect(cssHas("--peds-color-ignition:")).toBe(false);
    expect(cssHas("--peds-color-canvas:")).toBe(false);
    expect(cssHas("--peds-v6-paper:var(--peds-proto-paper)")).toBe(true);
    expect(cssHas("--peds-v6-stone:var(--peds-proto-paper-deep)")).toBe(true);
  });

  it("implements the exact Night/Chalk/Ember Home scene backgrounds without scaling cars", () => {
    expect(cssHas("--v5-scene-two,0")).toBe(true);
    expect(cssHas("--v5-scene-three,0")).toBe(true);
    expect(cssHas(".r1-cinema--v7[data-v5-scene='2']")).toBe(true);
    expect(cssHasSelector(".home-v5 .home-title-fight")).toBe(true);
    expect(cssHasSelector(".home-v5 .eds-explore")).toBe(true);
    expect(nav).toContain("hero.dataset.v5Scene === '2'");
    expect(cssHas("scale(1.2")).toBe(false);
  });

  it("keeps the intended light/dark page boundaries and unique team color system", () => {
    for (const selector of [
      ".r1-championship .destination-v6",
      ".r1-championship .results-v6-detail",
      ".r1-championship .cal-v5__detail",
      ".r1-championship .cal-v5__world",
      ".r1-championship .p5-standings-v5",
      "data-directory-kind='teams'",
      "data-directory-kind='drivers'",
      ".peds-about-layout.peds-about--prototype",
      ".peds-footer",
    ])
      expect(cssHasSelector(selector)).toBe(true);
    const teams = file("components/directory/editorialTeamPalette.ts");
    expect(teams).toContain("EDITORIAL_TEAM_SIGNATURES");
    expect(cssHas("var(--team-paper")).toBe(true);
    expect(cssHas("var(--team-deep")).toBe(true);
    expect(cssHas("nth-child(3n+2)")).toBe(false);
  });

  it("leaves 3D route styling under its old renderer and respects reduced motion", () => {
    expect(nav).toContain("'legacy'");
    expect(nav).toContain("/showroom");
    expect(nav).toContain("/engineering");
    expect(cssHas("data-prototype-surface='paper'")).toBe(true);
    expect(cssHas("data-prototype-surface='night'")).toBe(true);
    expect(cssHas(".model-b")).toBe(false);
    expect(cssHas(".engineering-anatomy")).toBe(false);
    expect(cssHas("prefers-reduced-motion:reduce")).toBe(true);
    expect(cssHas("forced-colors:active")).toBe(true);
    expect(cssHas("focus-visible")).toBe(true);
  });
});
