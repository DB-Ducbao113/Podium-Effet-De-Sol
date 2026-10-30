export type IntroSpeed = '1x' | '2x' | '3x';

export interface StartLightsTimingConfig {
  readonly speed: IntroSpeed;
  readonly firstLightMs: number;
  readonly lightIntervalMs: number;
  readonly holdMs: number;
  readonly lightsOutMs: number;
  readonly launchMs: number;
  readonly logoHoldMs: number;
  readonly revealDurationMs: number;
  readonly totalMs: number;
  readonly gridWakeMs: number;
  readonly rackWakeMs: number;
  readonly sweepMs: number;
  readonly brandSweepMs: number;
}

/** Original baseline: 6.2s full sequence */
export const START_LIGHT_TIMING_1X: StartLightsTimingConfig = {
  speed: '1x',
  firstLightMs: 1000,
  lightIntervalMs: 500,
  holdMs: 3000,
  lightsOutMs: 4000,
  launchMs: 4400,
  logoHoldMs: 1200,
  revealDurationMs: 600,
  totalMs: 6200,
  gridWakeMs: 1000,
  rackWakeMs: 950,
  sweepMs: 850,
  brandSweepMs: 450,
} as const;

/** Variant A: 2× speed (~4.2s total, generous cue & brand readability) */
export const START_LIGHT_TIMING_2X: StartLightsTimingConfig = {
  speed: '2x',
  firstLightMs: 350,
  lightIntervalMs: 240,
  holdMs: 1310,
  lightsOutMs: 1850,
  launchMs: 2750,
  logoHoldMs: 950,
  revealDurationMs: 550,
  totalMs: 4250,
  gridWakeMs: 350,
  rackWakeMs: 320,
  sweepMs: 280,
  brandSweepMs: 280,
} as const;

/**
 * Variant B: 3× speed (~3.35s total, preferred candidate)
 * - Snappy 5-light sequence (200ms -> 920ms)
 * - Tense hold (920ms -> 1350ms)
 * - Extended "LIGHTS OUT AND AWAY WE GO" punch (1350ms -> 2050ms = 700ms full readability)
 * - Extended "PODIUM EFFET DE SOL" brand hold (800ms) before reveal
 */
export const START_LIGHT_TIMING_3X: StartLightsTimingConfig = {
  speed: '3x',
  firstLightMs: 200,
  lightIntervalMs: 180,
  holdMs: 920,
  lightsOutMs: 1350,
  launchMs: 2050,
  logoHoldMs: 800,
  revealDurationMs: 500,
  totalMs: 3350,
  gridWakeMs: 200,
  rackWakeMs: 220,
  sweepMs: 200,
  brandSweepMs: 240,
} as const;

export const START_LIGHT_PROFILES: Record<IntroSpeed, StartLightsTimingConfig> = {
  '1x': START_LIGHT_TIMING_1X,
  '2x': START_LIGHT_TIMING_2X,
  '3x': START_LIGHT_TIMING_3X,
};

/** Default timing export preserved for backward-compatibility with baseline expectations */
export const START_LIGHT_TIMING = START_LIGHT_TIMING_1X;

export const DEFAULT_INTRO_SPEED: IntroSpeed = '3x';

export const START_LIGHT_CUE = "IT'S LIGHTS OUT AND AWAY WE GO!";

export function resolveIntroSpeed(): IntroSpeed {
  if (typeof window === 'undefined') return DEFAULT_INTRO_SPEED;
  try {
    const params = new URLSearchParams(window.location.search);
    const param = (params.get('intro') || params.get('speed'))?.toLowerCase();
    if (param === '1x' || param === '2x' || param === '3x') {
      window.localStorage?.setItem('peds-intro-speed', param);
      return param;
    }
    const saved = window.localStorage?.getItem('peds-intro-speed');
    if (saved === '1x' || saved === '2x' || saved === '3x') {
      return saved;
    }
  } catch {
    // ignore storage access errors
  }
  return DEFAULT_INTRO_SPEED;
}

export function getIntroTiming(speed: IntroSpeed = resolveIntroSpeed()): StartLightsTimingConfig {
  return START_LIGHT_PROFILES[speed] ?? START_LIGHT_TIMING_3X;
}

export function getStartLightsFrame(
  elapsedMs: number,
  timing: StartLightsTimingConfig = START_LIGHT_TIMING,
) {
  const time = Math.max(0, elapsedMs);
  const phase =
    time >= timing.totalMs
      ? 'complete'
      : time >= timing.launchMs
        ? 'launch'
        : time >= timing.lightsOutMs
          ? 'lights-out'
          : time >= timing.holdMs
            ? 'hold'
            : time >= timing.firstLightMs
              ? 'pressure'
              : 'awakening';
  const litColumns =
    time < timing.firstLightMs || time >= timing.lightsOutMs
      ? 0
      : Math.min(
          5,
          Math.floor(
            (time - timing.firstLightMs) / timing.lightIntervalMs,
          ) + 1,
        );
  return { phase, litColumns } as const;
}
