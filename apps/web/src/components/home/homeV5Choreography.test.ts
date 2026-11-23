import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  sampleV5Item,
  sampleV5Scene,
  sampleV5Target,
} from "./homeV5Choreography";

describe("Home V5.1 scroll transitions", () => {
  const tight = (source: string) => source.replace(/\s+/g, "");

  it("gives every engine the same frame for the same scroll position", () => {
    const target = { offset: 40, order: 2, height: 100, kind: "left" } as const;
    // 500 section top + 40 in-section offset + min(5, order) x 10px stagger.
    expect(sampleV5Target(target, 500, 900, false)).toEqual(
      sampleV5Item(560, 900, "left", false, 100),
    );
    expect(sampleV5Target(target, 500, 900, true)).toEqual(
      sampleV5Item(548, 900, "left", true, 100),
    );
    // The stagger ladder stops at the sixth item so a long list cannot trail offscreen.
    expect(sampleV5Target({ ...target, order: 9 }, 500, 900, false)).toEqual(
      sampleV5Item(590, 900, "left", false, 100),
    );
    for (const hook of [
      "useHomeV5Choreography.ts",
      "useHomeGsapChoreography.ts",
    ]) {
      expect(
        tight(readFileSync(`src/components/home/${hook}`, "utf8")),
      ).toContain("sampleV5Target(target,");
    }
  });

  it("replaces opacity-only caption swaps with reversible directional wipes", () => {
    const first = sampleV5Scene(0),
      mid = sampleV5Scene(0.48),
      last = sampleV5Scene(1);
    expect(first.firstX).toBe(0);
    expect(first.secondX).toBeGreaterThan(0);
    expect(mid.firstX).toBeLessThan(-100);
    expect(mid.secondX).toBe(0);
    expect(mid.secondMaskRight).toBe(0);
    expect(mid.photo2Opacity).toBeGreaterThan(0.5);
    expect(mid.photo2Clip).toBe(0);
    expect(last.secondX).toBeLessThan(-100);
    expect(last.thirdX).toBe(0);
    expect(last.thirdMask).toBe(0);
    expect(last.photo3X).toBe(0);
    expect(last.photo3Opacity).toBeGreaterThan(0.5);
    expect(last.photo3Clip).toBe(0);
    expect(sampleV5Scene(-3)).toEqual(first);
    expect(sampleV5Scene(3)).toEqual(last);
  });

  it("scrubs every card, heading, image and number without changing its value", () => {
    for (const kind of [
      "left",
      "right",
      "rise",
      "number",
      "wipe-left",
      "wipe-right",
    ] as const) {
      const before = sampleV5Item(1400, 900, kind);
      const after = sampleV5Item(100, 900, kind);
      expect(before.progress).toBe(0);
      expect(after.progress).toBe(1);
      expect(after.alpha).toBe(1);
      expect(after.x).toBe(0);
      expect(after.y).toBe(0);
      expect(after.left + after.right + after.bottom).toBe(0);
      expect(sampleV5Item(1400, 900, kind)).toEqual(before);
    }
    expect(sampleV5Item(1400, 900, "left", true).x).toBe(-26);
    expect(sampleV5Item(1400, 900, "left").x).toBe(-92);
    expect(sampleV5Item(1400, 900, "number").bottom).toBe(95);
    // Below -> visible -> above -> visible -> below, both directions.
    for (const kind of [
      "left",
      "right",
      "rise",
      "number",
      "wipe-left",
      "wipe-right",
    ] as const) {
      const before = sampleV5Item(1400, 900, kind, false, 120);
      const inside = sampleV5Item(170, 900, kind, false, 120);
      const past = sampleV5Item(-420, 900, kind, false, 120);
      expect(before.progress).toBe(0);
      expect(inside.progress).toBe(1);
      expect(past.progress).toBe(0);
      expect(past.exit).toBe(1);
      expect(sampleV5Item(170, 900, kind, false, 120)).toEqual(inside);
      expect(sampleV5Item(1400, 900, kind, false, 120)).toEqual(before);
    }
  });

  it("keeps the implementation scoped to Home and retains real repo assets", () => {
    const home = readFileSync("src/components/home/HomeView.tsx", "utf8");
    const hero = readFileSync(
      "src/components/home/PodiumBrandHero.tsx",
      "utf8",
    );
    const classic = readFileSync(
      "src/components/home/useHomeV5Choreography.ts",
      "utf8",
    );
    const gsapHook = readFileSync(
      "src/components/home/useHomeGsapChoreography.ts",
      "utf8",
    );
    const entries = readFileSync(
      "src/components/home/homeV5ChoreographyEntries.ts",
      "utf8",
    );
    const css = readFileSync("src/components/home/homeCinematicV5.css", "utf8");
    expect(home).toContain("useHomeV5Choreography(homeRef)");
    expect(home).toContain("useHomeGsapChoreography(homeRef)");
    expect(home).not.toContain("ModelBShowroom");
    expect(hero).toContain("<HomeRacePulseScene />");
    expect(hero).toContain("/images/home/explore/engineering.webp");
    expect(hero).toContain("/images/home/explore/drivers.webp");
    // The selector table is shared, so both engines choreograph the same sections.
    for (const token of [
      "race-control",
      "championship-overview",
      "eds-explore",
      "home-v5__editorial",
    ])
      expect(entries).toContain(token);
    for (const source of [classic, gsapHook]) {
      expect(source).toContain("HOME_V5_ENTRIES");
      expect(source).toContain("HOME_V5_SECTIONS");
    }
    expect(classic).toContain("prefers-reduced-motion");
    expect(gsapHook).toContain("readHomeMotionPolicy");
    expect(gsapHook).toContain("ScrollTrigger.create");
    expect(gsapHook).toContain("tier === 'off'");
    expect(gsapHook).not.toContain("gsap.to(");
    expect(gsapHook).not.toContain("gsap.from(");
    expect(classic).not.toContain("loadGsapRuntime");
    expect(tight(css)).toContain("object-fit:contain");
    expect(css).toContain("home-title-fight");
    expect(tight(css)).toContain("animation:none!important");
    // Both engines write only when progress changes, so a stable frame costs nothing.
    for (const token of [
      "target.lastEnter-value.enter",
      "target.lastExit-value.exit",
    ]) {
      expect(tight(classic)).toContain(token);
      expect(tight(gsapHook)).toContain(token);
    }
    expect(css).not.toMatch(/scale\(1\.[2-9]/);
  });
});
