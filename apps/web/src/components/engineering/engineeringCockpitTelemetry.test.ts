import { describe, expect, it } from "vitest";
import {
  ENGINEERING_COCKPIT_CONTROLS,
  INITIAL_COCKPIT_TELEMETRY_STATE,
  computeGlbLoadPercent,
  engineeringCockpitTelemetryReducer,
  evaluateCockpitTelemetry,
  isCockpitInspectorVisible,
} from "./engineeringCockpitTelemetry";

describe("engineeringCockpitTelemetry — F1 Cockpit 6-Zone & 15-LED OLED Telemetry Engine", () => {
  it("defines all 6 authentic F1 steering wheel control zones in VI and EN", () => {
    expect(ENGINEERING_COCKPIT_CONTROLS).toHaveLength(6);
    expect(ENGINEERING_COCKPIT_CONTROLS.map((c) => c.id)).toEqual([
      "DIFF",
      "BBAL",
      "STRAT",
      "DRS",
      "RADIO",
      "PIT",
    ]);

    for (const control of ENGINEERING_COCKPIT_CONTROLS) {
      expect(control.label.vi.length).toBeGreaterThan(3);
      expect(control.label.en.length).toBeGreaterThan(3);
      expect(control.dialSetting.vi.length).toBeGreaterThan(2);
      expect(control.dialSetting.en.length).toBeGreaterThan(2);
      expect(control.summary.vi.length).toBeGreaterThan(15);
      expect(control.summary.en.length).toBeGreaterThan(15);
      expect(control.partId).toMatch(/^STEERING_/);
    }
  });

  it("evaluates 15-LED shift lights, RPM, and speed deterministically across gears 1..8", () => {
    const baseEval = evaluateCockpitTelemetry(INITIAL_COCKPIT_TELEMETRY_STATE);
    expect(baseEval.gearLabel).toBe("4");
    expect(baseEval.shiftLeds).toHaveLength(15);
    expect(
      baseEval.shiftLeds.slice(0, 5).every((l) => l.band === "green"),
    ).toBe(true);
    expect(baseEval.shiftLeds.slice(5, 10).every((l) => l.band === "red")).toBe(
      true,
    );
    expect(
      baseEval.shiftLeds.slice(10, 15).every((l) => l.band === "blue"),
    ).toBe(true);

    const gear1 = evaluateCockpitTelemetry({
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      gear: 1,
    });
    const gear8 = evaluateCockpitTelemetry({
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      gear: 8,
      drsActive: true,
    });

    expect(gear8.rpm).toBeGreaterThan(gear1.rpm);
    expect(gear8.speedKmh).toBeGreaterThan(gear1.speedKmh);
    expect(gear8.activeLedCount).toBe(15);
    expect(gear8.drsStatus).toBe("ACTIVE");
    expect(gear1.drsEligible).toBe(false);
    expect(gear1.drsStatus).toBe("LOCKED");
  });

  it("enforces Pit Lane Speed Limiter (80 km/h cap, Gear P, DRS locked) and control transitions", () => {
    let state = engineeringCockpitTelemetryReducer(
      INITIAL_COCKPIT_TELEMETRY_STATE,
      { type: "step-gear", delta: 3 },
    );
    expect(state.gear).toBe(7);

    state = engineeringCockpitTelemetryReducer(state, { type: "toggle-drs" });
    expect(state.drsActive).toBe(true);

    // Selecting or toggling PIT engages pit limiter and disables DRS
    state = engineeringCockpitTelemetryReducer(state, {
      type: "select-control",
      controlId: "PIT",
    });
    expect(state.activeControlId).toBe("PIT");
    expect(state.pitLimiter).toBe(true);
    expect(state.drsActive).toBe(false);

    const pitEval = evaluateCockpitTelemetry(state);
    expect(pitEval.gearLabel).toBe("P");
    expect(pitEval.speedKmh).toBe(80);
    expect(pitEval.drsStatus).toBe("LOCKED");

    const resetState = engineeringCockpitTelemetryReducer(state, {
      type: "reset",
    });
    expect(resetState).toEqual(INITIAL_COCKPIT_TELEMETRY_STATE);
  });

  it("shows cockpit inspector only in cockpit chapter or when a cockpit/steering part is selected", () => {
    expect(isCockpitInspectorVisible("cockpit", null)).toBe(true);
    expect(isCockpitInspectorVisible("aero", "STEERING_WHEEL_LCD")).toBe(true);
    expect(isCockpitInspectorVisible("matrix", "STEERING_ENCODERS_LEDS")).toBe(
      true,
    );
    expect(isCockpitInspectorVisible("origin", null)).toBe(false);
    expect(isCockpitInspectorVisible("aero", "FRONT_WING_ASSEMBLY")).toBe(
      false,
    );
  });

  it("computes clamped GLB loading percentage safely even when Content-Length is missing", () => {
    expect(computeGlbLoadPercent(0, 9_966_120, "init")).toBe(0);
    expect(computeGlbLoadPercent(4_983_060, 9_966_120, "downloading")).toBe(46);
    expect(computeGlbLoadPercent(9_966_120, 9_966_120, "downloading")).toBe(92);
    // Missing Content-Length (0) falls back to nominal 9,966,120 bytes without NaN
    expect(computeGlbLoadPercent(4_983_060, 0, "downloading")).toBe(46);
    expect(computeGlbLoadPercent(20_000_000, 0, "downloading")).toBe(92);
    expect(computeGlbLoadPercent(9_966_120, 9_966_120, "parsing")).toBe(96);
    expect(computeGlbLoadPercent(9_966_120, 9_966_120, "ready")).toBe(100);
  });
});
