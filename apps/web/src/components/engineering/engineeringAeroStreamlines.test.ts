import { describe, expect, it } from "vitest";
import {
  ENGINEERING_AERO_STREAMLINES,
  ENGINEERING_CFD_ZONES,
  isAnyCfdZoneValid,
  resolveCfdZoneOpacities,
  resolveStreamlinePointsForExplode,
} from "./engineeringAeroStreamlines";

describe("engineeringAeroStreamlines — 3D Ground-Effect CFD Streamlines Geometry Contract", () => {
  it("defines 12 symmetric 3D streamlines across all 3 aerodynamic zones", () => {
    expect(ENGINEERING_CFD_ZONES.map((z) => z.id)).toEqual([
      "front-wing",
      "sidepod-inwash",
      "venturi-underfloor",
    ]);
    expect(ENGINEERING_AERO_STREAMLINES).toHaveLength(12);

    const byZone = ENGINEERING_AERO_STREAMLINES.reduce<Record<string, number>>(
      (acc, line) => {
        acc[line.zone] = (acc[line.zone] ?? 0) + 1;
        return acc;
      },
      {},
    );
    expect(byZone).toEqual({
      "front-wing": 4,
      "sidepod-inwash": 4,
      "venturi-underfloor": 4,
    });
  });

  it("keeps all 3D streamline coordinates finite and inside the measured FP-04 RB envelope", () => {
    for (const line of ENGINEERING_AERO_STREAMLINES) {
      expect(line.points.length).toBeGreaterThanOrEqual(5);
      expect(line.radius).toBeGreaterThan(0.004);
      expect(line.speed).toBeGreaterThan(0.4);

      for (let i = 0; i < line.points.length; i += 1) {
        const [x, y, z] = line.points[i];
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(z)).toBe(true);
        expect(Math.abs(x)).toBeLessThanOrEqual(1.25);
        expect(y).toBeGreaterThanOrEqual(0.04);
        expect(y).toBeLessThanOrEqual(1.15);
        expect(z).toBeGreaterThanOrEqual(-3.2);
        expect(z).toBeLessThanOrEqual(3.2);

        // Flow progresses strictly front (-Z) to rear (+Z)
        if (i > 0) {
          expect(z).toBeGreaterThan(line.points[i - 1][2]);
        }
      }
    }
  });

  it("maintains exact left/right lateral symmetry and adapts smoothly to explodeRatio", () => {
    const leftLines = ENGINEERING_AERO_STREAMLINES.filter(
      (l) => l.side === "left",
    );
    const rightLines = ENGINEERING_AERO_STREAMLINES.filter(
      (l) => l.side === "right",
    );
    expect(leftLines).toHaveLength(6);
    expect(rightLines).toHaveLength(6);

    for (let i = 0; i < leftLines.length; i += 1) {
      const left = leftLines[i];
      const right = rightLines[i];
      expect(left.zone).toBe(right.zone);
      expect(left.points).toHaveLength(right.points.length);
      for (let p = 0; p < left.points.length; p += 1) {
        expect(left.points[p][0]).toBeCloseTo(-right.points[p][0], 4);
        expect(left.points[p][1]).toBeCloseTo(right.points[p][1], 4);
        expect(left.points[p][2]).toBeCloseTo(right.points[p][2], 4);
      }
    }

    const sample = leftLines[0];
    const datumPts = resolveStreamlinePointsForExplode(sample, 0);
    const explodedPts = resolveStreamlinePointsForExplode(sample, 1);
    expect(datumPts).toEqual(sample.points);
    expect(Math.abs(explodedPts[2][0])).toBeGreaterThan(
      Math.abs(datumPts[2][0]),
    );
  });

  it("gates each CFD zone opacity cleanly by its reference assembly phase (G2.2 Option B)", () => {
    const assembled = resolveCfdZoneOpacities({
      FRONT_WING_ASSEMBLY: { phase: 0 },
      NOSECONE_SHELL: { phase: 0 },
      SIDEPOD_SHELL_LEFT: { phase: 0 },
      SIDEPOD_SHELL_RIGHT: { phase: 0 },
      VENTURI_FLOOR_TITANIUM: { phase: 0 },
    });
    expect(assembled).toEqual({
      "front-wing": 1,
      "sidepod-inwash": 1,
      "venturi-underfloor": 1,
    });
    expect(isAnyCfdZoneValid(assembled)).toBe(true);

    // Front wing detached: only front-wing zone fades to 0; sidepods & underfloor stay valid
    const fwDetached = resolveCfdZoneOpacities({
      FRONT_WING_ASSEMBLY: { phase: 1 },
      NOSECONE_SHELL: { phase: 0 },
      SIDEPOD_SHELL_LEFT: { phase: 0 },
      SIDEPOD_SHELL_RIGHT: { phase: 0 },
      VENTURI_FLOOR_TITANIUM: { phase: 0 },
    });
    expect(fwDetached["front-wing"]).toBe(0);
    expect(fwDetached["sidepod-inwash"]).toBe(1);
    expect(fwDetached["venturi-underfloor"]).toBe(1);
    expect(isAnyCfdZoneValid(fwDetached)).toBe(true);

    // All aero assemblies detached (e.g. Exploded Matrix): all zones 0 -> notice triggered
    const allDetached = resolveCfdZoneOpacities({
      FRONT_WING_ASSEMBLY: { phase: 1 },
      NOSECONE_SHELL: { phase: 1 },
      SIDEPOD_SHELL_LEFT: { phase: 1 },
      SIDEPOD_SHELL_RIGHT: { phase: 1 },
      VENTURI_FLOOR_TITANIUM: { phase: 1 },
    });
    expect(allDetached).toEqual({
      "front-wing": 0,
      "sidepod-inwash": 0,
      "venturi-underfloor": 0,
    });
    expect(isAnyCfdZoneValid(allDetached)).toBe(false);
  });
});
