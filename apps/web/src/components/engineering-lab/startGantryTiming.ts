export type StartGantryPhase =
  | "awakening"
  | "sequence"
  | "hold"
  | "lights-out"
  | "brand-launch"
  | "shutter-reveal"
  | "complete";

export type StartGantrySceneTheme =
  | "storm-grid"
  | "storm-lights-out"
  | "storm-pack-launch"
  | "storm-slipstream-wipe";

export interface StartGantryTimingConfig {
  readonly firstLightMs: number;
  readonly lightIntervalMs: number;
  readonly lightsOutMs: number;
  readonly brandLaunchMs: number;
  readonly shutterOpenMs: number;
  readonly totalMs: number;
}

export interface StartGantryFrame {
  readonly phase: StartGantryPhase;
  readonly sceneTheme: StartGantrySceneTheme;
  readonly litColumns: number;
  readonly allLampsHot: boolean;
  readonly flareIntensity: number;
  readonly phaseProgress: number;
  readonly gantryFlyPastProgress: number;
  readonly warpVelocity: number;
  readonly launchSpeedKmh: number;
  readonly cameraPushScale: number;
  readonly vignetteOpacity: number;
}

/**
 * FIA-inspired 4-beat Storm Midnight Start-Gantry + 5-Car Mini F1 Pack Launch rhythm (v4):
 * - 0..380ms: Overhead gantry wakes above wet night-race asphalt (#070b14)
 * - 380..2540ms: 5 twin-LED columns ignite at 540ms weighted intervals
 * - 2540..3280ms: 740ms breathless hold at peak optical pressure
 * - 3280..4140ms: 0ms blackout + clutch-bite surge + Storm light-trails ("IT'S / LIGHTS OUT. / AND AWAY WE GO!", 860ms)
 * - 4140..5180ms: Full Official /logo/logo.png + 5-Car Low Side-Profile Mini F1 Grid Pack rocketing left-to-right ("cái vèo", 1040ms)
 * - 5180..5820ms: Left-to-right aerodynamic slipstream curtain wipe into Homepage "/" or 3D FP-04 RB Hero (640ms)
 */
export const CINEMATIC_GANTRY_TIMING: StartGantryTimingConfig = {
  firstLightMs: 380,
  lightIntervalMs: 540,
  lightsOutMs: 3280,
  brandLaunchMs: 4140,
  shutterOpenMs: 5180,
  totalMs: 5820,
} as const;

export const REDUCED_GANTRY_TIMING: StartGantryTimingConfig = {
  firstLightMs: 15,
  lightIntervalMs: 15,
  lightsOutMs: 90,
  brandLaunchMs: 135,
  shutterOpenMs: 185,
  totalMs: 235,
} as const;

export const SANDBOX_INTRO_SEEN_KEY = "peds-eng-lab-cinematic-intro-seen";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function evaluateStartGantryFrame(
  elapsedMs: number,
  timing: StartGantryTimingConfig = CINEMATIC_GANTRY_TIMING,
): StartGantryFrame {
  const t = Math.max(0, elapsedMs);
  const fifthLightOnMs = timing.firstLightMs + 4 * timing.lightIntervalMs;

  if (t >= timing.totalMs) {
    return {
      phase: "complete",
      sceneTheme: "storm-slipstream-wipe",
      litColumns: 0,
      allLampsHot: false,
      flareIntensity: 0,
      phaseProgress: 1,
      gantryFlyPastProgress: 1,
      warpVelocity: 0,
      launchSpeedKmh: 324,
      cameraPushScale: 1.32,
      vignetteOpacity: 0,
    };
  }

  if (t >= timing.shutterOpenMs) {
    const progress = clamp01(
      (t - timing.shutterOpenMs) /
        Math.max(1, timing.totalMs - timing.shutterOpenMs),
    );
    return {
      phase: "shutter-reveal",
      sceneTheme: "storm-slipstream-wipe",
      litColumns: 0,
      allLampsHot: false,
      flareIntensity: 0,
      phaseProgress: progress,
      gantryFlyPastProgress: 1,
      warpVelocity: 1.18,
      launchSpeedKmh: 314 + Math.round(progress * 10),
      cameraPushScale: 1.12 + progress * 0.2,
      vignetteOpacity: 0.14 * (1 - progress),
    };
  }

  if (t >= timing.brandLaunchMs) {
    const progress = clamp01(
      (t - timing.brandLaunchMs) /
        Math.max(1, timing.shutterOpenMs - timing.brandLaunchMs),
    );
    return {
      phase: "brand-launch",
      sceneTheme: "storm-pack-launch",
      litColumns: 0,
      allLampsHot: false,
      flareIntensity: 0,
      phaseProgress: progress,
      gantryFlyPastProgress: 1,
      warpVelocity: 0.94 + progress * 0.22,
      launchSpeedKmh: 188 + Math.round(progress * 126),
      cameraPushScale: 1.0 + progress * 0.12,
      vignetteOpacity: 0.22,
    };
  }

  if (t >= timing.lightsOutMs) {
    const progress = clamp01(
      (t - timing.lightsOutMs) /
        Math.max(1, timing.brandLaunchMs - timing.lightsOutMs),
    );
    return {
      phase: "lights-out",
      sceneTheme: "storm-lights-out",
      litColumns: 0,
      allLampsHot: false,
      flareIntensity: 0,
      phaseProgress: progress,
      gantryFlyPastProgress: clamp01(progress / 0.5),
      warpVelocity: 0.92 + progress * 0.16,
      launchSpeedKmh: 22 + Math.round(progress * 166),
      cameraPushScale: 1.04 + progress * 0.14,
      vignetteOpacity: 0.28,
    };
  }

  if (t >= fifthLightOnMs) {
    const holdRatio = clamp01(
      (t - fifthLightOnMs) / Math.max(1, timing.lightsOutMs - fifthLightOnMs),
    );
    return {
      phase: "hold",
      sceneTheme: "storm-grid",
      litColumns: 5,
      allLampsHot: true,
      flareIntensity: 1,
      phaseProgress: holdRatio,
      gantryFlyPastProgress: 0,
      warpVelocity: 0,
      launchSpeedKmh: 0,
      cameraPushScale: 1.024 + holdRatio * 0.012,
      vignetteOpacity: 0.88 + holdRatio * 0.08,
    };
  }

  if (t >= timing.firstLightMs) {
    const seqSpan = Math.max(1, fifthLightOnMs - timing.firstLightMs);
    const litColumns = Math.min(
      5,
      Math.floor((t - timing.firstLightMs) / timing.lightIntervalMs) + 1,
    );
    const ratio = litColumns / 5;
    return {
      phase: "sequence",
      sceneTheme: "storm-grid",
      litColumns,
      allLampsHot: litColumns === 5,
      flareIntensity: ratio,
      phaseProgress: clamp01((t - timing.firstLightMs) / seqSpan),
      gantryFlyPastProgress: 0,
      warpVelocity: 0,
      launchSpeedKmh: 0,
      cameraPushScale: 1 + ratio * 0.024,
      vignetteOpacity: 0.68 + ratio * 0.2,
    };
  }

  const wakeProgress = clamp01(t / Math.max(1, timing.firstLightMs));
  return {
    phase: "awakening",
    sceneTheme: "storm-grid",
    litColumns: 0,
    allLampsHot: false,
    flareIntensity: 0,
    phaseProgress: wakeProgress,
    gantryFlyPastProgress: 0,
    warpVelocity: 0,
    launchSpeedKmh: 0,
    cameraPushScale: 0.992 + wakeProgress * 0.008,
    vignetteOpacity: 0.64,
  };
}
