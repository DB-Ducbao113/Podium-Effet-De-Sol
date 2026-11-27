import { describe, expect, it } from "vitest";
import {
  INITIAL_LAB_SIMULATOR_STATE,
  evaluateLabTelemetry,
  labSimulatorReducer,
  parseLabModeParam,
} from "./labSimulatorEngine";

describe("labSimulatorEngine — 4-Mode Deterministic Engineering Simulator", () => {
  it("initializes Active Aero at 18° default with Medium/Medium tendencies (REQ-13)", () => {
    expect(INITIAL_LAB_SIMULATOR_STATE.mode).toBe("active-aero");
    expect(INITIAL_LAB_SIMULATOR_STATE.wingAngleDeg).toBe(18);
    const telemetry = evaluateLabTelemetry(INITIAL_LAB_SIMULATOR_STATE);
    expect(telemetry.primaryMetricLabel.en).toContain("18°");
    expect(telemetry.downforceTendency.level).toBe("medium");
    expect(telemetry.dragTendency.level).toBe("medium");
  });

  it("clamps wing angle strictly to [0, 35] and shifts tendencies monotonically", () => {
    const low = labSimulatorReducer(INITIAL_LAB_SIMULATOR_STATE, {
      type: "set-wing-angle",
      angleDeg: -12,
    });
    expect(low.wingAngleDeg).toBe(0);
    expect(evaluateLabTelemetry(low).downforceTendency.level).toBe("low");
    expect(evaluateLabTelemetry(low).dragTendency.level).toBe("low");

    const high = labSimulatorReducer(INITIAL_LAB_SIMULATOR_STATE, {
      type: "set-wing-angle",
      angleDeg: 99,
    });
    expect(high.wingAngleDeg).toBe(35);
    expect(evaluateLabTelemetry(high).downforceTendency.level).toBe("peak");
    expect(evaluateLabTelemetry(high).dragTendency.level).toBe("peak");
  });

  it("models non-monotonic Ground Effect Venturi sweet spot vs low-clearance stall risk (REQ-14)", () => {
    const sweetSpot = labSimulatorReducer(INITIAL_LAB_SIMULATOR_STATE, {
      type: "set-ride-height",
      rideHeightMm: 22,
    });
    const stalled = labSimulatorReducer(INITIAL_LAB_SIMULATOR_STATE, {
      type: "set-ride-height",
      rideHeightMm: 10, // clamps to 15mm -> boundary-layer stall warning
    });
    const highClearance = labSimulatorReducer(INITIAL_LAB_SIMULATOR_STATE, {
      type: "set-ride-height",
      rideHeightMm: 60, // clamps to 45mm -> diffuser seal leakage
    });

    expect(stalled.rideHeightMm).toBe(15);
    expect(highClearance.rideHeightMm).toBe(45);

    const sweetEval = evaluateLabTelemetry({
      ...sweetSpot,
      mode: "ground-effect",
    });
    const stalledEval = evaluateLabTelemetry({
      ...stalled,
      mode: "ground-effect",
    });
    const highEval = evaluateLabTelemetry({
      ...highClearance,
      mode: "ground-effect",
    });

    expect(sweetEval.venturiStabilityPct).toBeGreaterThan(
      stalledEval.venturiStabilityPct,
    );
    expect(sweetEval.suctionIndexPct).toBeGreaterThan(highEval.suctionIndexPct);
    expect(stalledEval.stallRiskWarning).toBe(true);
  });

  it("evaluates Hybrid Powertrain deploy/harvest energy direction, reactive ERS gauges, and mode-specific localized tendency titles (BUG-04)", () => {
    const deployHigh = evaluateLabTelemetry({
      ...INITIAL_LAB_SIMULATOR_STATE,
      mode: "hybrid-powertrain",
      wingAngleDeg: 35,
      hybridRegime: "deploy",
      ersIntensityPct: 90,
    });
    const harvestLow = evaluateLabTelemetry({
      ...INITIAL_LAB_SIMULATOR_STATE,
      mode: "hybrid-powertrain",
      wingAngleDeg: 35,
      hybridRegime: "harvest",
      ersIntensityPct: 15,
    });
    const harvestHigh = evaluateLabTelemetry({
      ...INITIAL_LAB_SIMULATOR_STATE,
      mode: "hybrid-powertrain",
      wingAngleDeg: 0,
      hybridRegime: "harvest",
      ersIntensityPct: 92,
    });

    expect(deployHigh.primaryTendencyTitle.en).toBe("ELECTRIC DRIVE OUTPUT");
    expect(deployHigh.primaryTendencyTitle.vi).toBe("CÔNG SUẤT ĐIỆN MGU-K");
    expect(harvestHigh.primaryTendencyTitle.en).toBe("REGEN HARVEST RATE");
    expect(harvestHigh.secondaryTendencyTitle.en).toBe("ES BATTERY CHARGE RATE");
    expect(harvestHigh.energyFlowDirection).toBe("regen-to-battery");
    expect(harvestHigh.rearRainLightHarvesting).toBe(true);
    // Gauges react strictly to Hybrid regime & ERS %, never frozen to wingAngleDeg
    expect(harvestHigh.downforceTendency.scorePct).toBeGreaterThan(
      harvestLow.downforceTendency.scorePct,
    );
    expect(harvestHigh.dragTendency.scorePct).toBeGreaterThan(
      deployHigh.dragTendency.scorePct,
    );

    const groundEval = evaluateLabTelemetry({
      ...INITIAL_LAB_SIMULATOR_STATE,
      mode: "ground-effect",
      rideHeightMm: 16,
    });
    expect(groundEval.primaryTendencyTitle.en).toBe("VENTURI SUCTION");
    expect(groundEval.secondaryTendencyTitle.en).toBe("FLOOR SEAL STABILITY");

    const cornering = labSimulatorReducer(
      {
        ...INITIAL_LAB_SIMULATOR_STATE,
        mode: "vehicle-dynamics",
        chassisPhase: "braking",
      },
      { type: "set-lateral-load", loadG: 4.8 },
    );
    const dynEval = evaluateLabTelemetry(cornering);
    expect(dynEval.primaryTendencyTitle.en).toBe("MECHANICAL GRIP DEMAND");
    expect(dynEval.secondaryTendencyTitle.en).toBe("LOAD TRANSFER INTENSITY");
    expect(dynEval.outsideTireLoadSharePct).toBeGreaterThan(65);
    expect(dynEval.chassisPitchRad).toBeGreaterThan(0);
  });

  it("parses valid ?lab= query parameters and falls back safely on invalid input", () => {
    expect(parseLabModeParam("hybrid-powertrain")).toBe("hybrid-powertrain");
    expect(parseLabModeParam("ground-effect")).toBe("ground-effect");
    expect(parseLabModeParam("xss<script>")).toBe("active-aero");
    expect(parseLabModeParam(null)).toBe("active-aero");
  });
});
