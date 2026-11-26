import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Storm Visual Craft — OKLCH/P3 Color Science, OpenType Telemetry & Zero-Layout-Change Contract", () => {
  const craftCss = readFileSync(
    path.resolve("src/components/storm/stormVisualCraft.css"),
    "utf8",
  );
  const shellSource = readFileSync(
    path.resolve("src/components/storm/StormAppShell.tsx"),
    "utf8",
  );

  it("loads stormVisualCraft.css after stormShell.css inside StormAppShell", () => {
    const shellIdx = shellSource.indexOf('import "./stormShell.css"');
    const craftIdx = shellSource.indexOf('import "./stormVisualCraft.css"');
    expect(shellIdx).toBeGreaterThan(-1);
    expect(craftIdx).toBeGreaterThan(shellIdx);
  });

  it("provides progressive OKLCH, Display-P3, color-mix(), OpenType telemetry, and forced-colors fallback", () => {
    expect(craftCss).toContain("@supports (color: oklch(");
    expect(craftCss).toContain("@media (color-gamut: p3)");
    expect(craftCss).toContain("color-mix(in oklch,");
    expect(craftCss).toContain("slashed-zero");
    expect(craftCss).toContain("text-wrap: balance");
    expect(craftCss).toContain("text-wrap: pretty");
    expect(craftCss).toContain("@media (forced-colors: active)");
  });

  it("preserves strict zero-layout-change discipline and never uses transparent text-fill on SplitText headings", () => {
    const stripped = craftCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(stripped).not.toMatch(
      /\b(?:width|height|padding|margin|grid-template|flex-direction|display)\s*:/i,
    );
    // Regression guard: `-webkit-text-fill-color: transparent` is inherited by GSAP
    // SplitText inner word/line spans while `background-clip: text` is not, turning headings invisible.
    expect(stripped).not.toMatch(/-webkit-text-fill-color\s*:\s*transparent/i);
  });
});
