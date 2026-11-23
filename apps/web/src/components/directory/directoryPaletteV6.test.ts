import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EDITORIAL_TEAM_TONES,
  EDITORIAL_TEAM_SIGNATURES,
} from "./editorialTeamPalette";

const css = readFileSync(
  "src/components/directory/directoryPaletteV6.css",
  "utf8",
);
const compactCss = css.replace(/\s+/g, "");

describe("PEDS V6 directory palette — prototype reference", () => {
  it("covers all 11 constructor identities without replacing standings data", () => {
    expect(Object.keys(EDITORIAL_TEAM_TONES)).toHaveLength(11);
    expect(EDITORIAL_TEAM_TONES.mclaren).toBe("#e89c5b");
    expect(EDITORIAL_TEAM_TONES.ferrari).toBe("#c55d50");
    expect(EDITORIAL_TEAM_TONES.mercedes).toBe("#5cae9b");
    expect(EDITORIAL_TEAM_TONES.redbull).toBe("#536e93");
    expect(EDITORIAL_TEAM_TONES.astonmartin).toBe("#639b89");
    expect(Object.keys(EDITORIAL_TEAM_SIGNATURES).sort()).toEqual(
      Object.keys(EDITORIAL_TEAM_TONES).sort(),
    );
    expect(
      new Set(Object.values(EDITORIAL_TEAM_SIGNATURES).map((x) => x.paper))
        .size,
    ).toBe(11);
    expect(
      new Set(Object.values(EDITORIAL_TEAM_SIGNATURES).map((x) => x.deep)).size,
    ).toBe(11);
    expect(EDITORIAL_TEAM_SIGNATURES.ferrari.accent).toBe("#ffe500");
    expect(EDITORIAL_TEAM_SIGNATURES.mclaren.accent).toBe("#47c7fc");
    expect(EDITORIAL_TEAM_SIGNATURES.audi.accent).toBe("#f50537");
    expect(EDITORIAL_TEAM_SIGNATURES.cadillac.accent).toBe("#d4af37");
    expect(EDITORIAL_TEAM_SIGNATURES.haas.accent).toBe("#e6002b");
  });

  it("uses warm paper for Teams and charcoal team-colored portraits for Drivers", () => {
    for (const token of [
      "#efede7",
      "#e4e0d8",
      "#171b19",
      "#151b19",
      "#e2dfd7",
      "#d16a49",
      ".p5-team-card-body::before",
      ".p5-driver-card--directory .p5-driver-card-visual",
    ])
      expect(css).toContain(token);
    expect(compactCss).toContain("--dir6-paper:#efede7;");
    expect(compactCss).toContain("--dir6-driver-field:#151b19;");
    expect(compactCss).toContain("--team-paper:var(--peds-dir-paper,#e2dfd7);");
    expect(compactCss).toContain("var(--peds-dir-team");
    expect(compactCss).toContain("var(--peds-dir-driver");
    expect(compactCss).toContain("var(--peds-dir-paper");
    expect(compactCss).toContain("var(--peds-dir-deep");
    expect(compactCss).toContain("var(--peds-dir-accent");
    expect(compactCss).not.toContain("nth-child(3n+2)");
  });

  it("preserves image color, keyboard focus, mobile layout and reduced motion", () => {
    expect(css).toMatch(
      /\.p5-team-card--garage\s+\.p5-team-card-art\s+img\s*\{\s*filter:\s*none;\s*\}/,
    );
    expect(compactCss).toContain("filter:none;");
    expect(css).toContain(":focus-visible");
    expect(css).toMatch(/@media\s*\(max-width:\s*690px\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*380px\)/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/@media\s*\(forced-colors:\s*active\)/);
  });
});
