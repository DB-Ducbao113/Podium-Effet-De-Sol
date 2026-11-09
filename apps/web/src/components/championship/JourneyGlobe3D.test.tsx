import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/components/championship/JourneyGlobe3D.tsx",
  "utf8",
);

describe("Journey globe clarity and motion", () => {
  it("caps pixel ratio at 2 and sharpens the chart texture", () => {
    expect(source).toContain("dpr={[1, 2]}");
    expect(source).toContain("gl.capabilities.getMaxAnisotropy()");
    expect(source).toContain("Math.min(4,");
    expect(source).toContain("sphereGeometry args={[RADIUS, 96, 64]}");
  });

  it("keeps ocean and land legible instead of a near-black ball", () => {
    expect(source).toContain("context.fillStyle = '#0e2c40'");
    expect(source).toContain("context.fillStyle = '#3a6076'");
    expect(source).toContain('color="#ffffff" map={texture ?? undefined}');
    expect(source).not.toContain("#061724");
    expect(source).not.toContain('color="#d6f8ff"');
  });

  it("uses frame-rate-independent damping matched to the reference globe", () => {
    expect(source).toContain("1 - Math.pow(0.84, Math.min(delta, 0.08) * 60)");
    expect(source).not.toContain("Math.exp(-Math.min(0.1, delta) * 3.6)");
  });

  it("renders only on a real GPU and keeps the demand frameloop", () => {
    expect(source).toContain('frameloop="demand"');
    expect(source).toContain("antialias: true");
  });

  it("places the city above the active or hovered dot and fades it with markers", () => {
    expect(source).toContain("(active || hovered)");
    expect(source).toContain("stop.race.location");
    expect(source).toContain("position={[0, 0, 0]}");
    expect(source).toContain("opacity: markerOpacity");
    expect(source).toContain("occlude={[surfaceRef]}");
  });
});
