import { describe, expect, it } from "vitest";
import {
  CINEMATIC_GANTRY_TIMING,
  REDUCED_GANTRY_TIMING,
  evaluateStartGantryFrame,
} from "./startGantryTiming";

describe("startGantryTiming — Cinematic FIA 5-Red-Lights Engine", () => {
  it("enforces >= 480ms beat per column and >= 550ms breathless hold in standard mode", () => {
    expect(CINEMATIC_GANTRY_TIMING.lightIntervalMs).toBeGreaterThanOrEqual(480);
    const fifthLightOnMs =
      CINEMATIC_GANTRY_TIMING.firstLightMs +
      4 * CINEMATIC_GANTRY_TIMING.lightIntervalMs;
    const holdDurationMs = CINEMATIC_GANTRY_TIMING.lightsOutMs - fifthLightOnMs;
    expect(holdDurationMs).toBeGreaterThanOrEqual(550);
  });

  it("progresses monotonically across awakening -> columns 1..5 -> hold -> 0ms lights-out -> brand-launch -> shutter -> complete", () => {
    const f0 = evaluateStartGantryFrame(0, CINEMATIC_GANTRY_TIMING);
    expect(f0.phase).toBe("awakening");
    expect(f0.litColumns).toBe(0);

    for (let col = 1; col <= 5; col += 1) {
      const t =
        CINEMATIC_GANTRY_TIMING.firstLightMs +
        (col - 1) * CINEMATIC_GANTRY_TIMING.lightIntervalMs +
        10;
      const frame = evaluateStartGantryFrame(t, CINEMATIC_GANTRY_TIMING);
      expect(frame.litColumns).toBe(col);
      expect(frame.flareIntensity).toBeCloseTo(col / 5, 3);
    }

    const holdFrame = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.lightsOutMs - 40,
      CINEMATIC_GANTRY_TIMING,
    );
    expect(holdFrame.phase).toBe("hold");
    expect(holdFrame.litColumns).toBe(5);
    expect(holdFrame.allLampsHot).toBe(true);

    // Beat A: Instantaneous 0ms FIA blackout + Flash-Cut Radial Warp "IT'S LIGHTS OUT AND AWAY WE GO!" (~900ms)
    const snapStart = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.lightsOutMs,
      CINEMATIC_GANTRY_TIMING,
    );
    const snapMid = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.lightsOutMs + 450,
      CINEMATIC_GANTRY_TIMING,
    );
    expect(snapStart.phase).toBe("lights-out");
    expect(snapStart.litColumns).toBe(0);
    expect(snapStart.allLampsHot).toBe(false);
    expect(snapStart.flareIntensity).toBe(0);
    expect(snapStart.warpVelocity).toBeGreaterThanOrEqual(0.85);
    expect(snapMid.phaseProgress).toBeGreaterThan(snapStart.phaseProgress);
    expect(snapMid.gantryFlyPastProgress).toBeGreaterThan(
      snapStart.gantryFlyPastProgress,
    );
    expect(snapMid.cameraPushScale).toBeGreaterThan(snapStart.cameraPushScale);
    expect(
      CINEMATIC_GANTRY_TIMING.brandLaunchMs -
        CINEMATIC_GANTRY_TIMING.lightsOutMs,
    ).toBeGreaterThanOrEqual(800);

    // Beat B: Cyan/Platinum Shockwave Brand Detonation ("PODIUM. EFFET DE SOL" + OfficialBrandLogo, ~950ms)
    const brandStart = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.brandLaunchMs + 20,
      CINEMATIC_GANTRY_TIMING,
    );
    const brandLate = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.brandLaunchMs + 650,
      CINEMATIC_GANTRY_TIMING,
    );
    expect(brandStart.phase).toBe("brand-launch");
    expect(brandStart.litColumns).toBe(0);
    expect(brandStart.gantryFlyPastProgress).toBe(1);
    expect(brandStart.warpVelocity).toBeGreaterThanOrEqual(0.8);
    expect(brandLate.phaseProgress).toBeGreaterThan(brandStart.phaseProgress);
    expect(brandLate.cameraPushScale).toBeGreaterThan(
      brandStart.cameraPushScale,
    );
    expect(
      CINEMATIC_GANTRY_TIMING.shutterOpenMs -
        CINEMATIC_GANTRY_TIMING.brandLaunchMs,
    ).toBeGreaterThanOrEqual(850);

    const shutterFrame = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.shutterOpenMs + 20,
      CINEMATIC_GANTRY_TIMING,
    );
    expect(shutterFrame.phase).toBe("shutter-reveal");
    expect(shutterFrame.cameraPushScale).toBeGreaterThan(
      brandLate.cameraPushScale,
    );

    const doneFrame = evaluateStartGantryFrame(
      CINEMATIC_GANTRY_TIMING.totalMs + 1,
      CINEMATIC_GANTRY_TIMING,
    );
    expect(doneFrame.phase).toBe("complete");
    expect(doneFrame.warpVelocity).toBe(0);
  });

  it("provides a fast <= 240ms reduced-motion timing profile", () => {
    expect(REDUCED_GANTRY_TIMING.totalMs).toBeLessThanOrEqual(240);
    expect(
      evaluateStartGantryFrame(REDUCED_GANTRY_TIMING.totalMs, REDUCED_GANTRY_TIMING)
        .phase,
    ).toBe("complete");
  });
});
