export const START_LIGHT_TIMING = {
  firstLightMs: 1000,
  lightIntervalMs: 500,
  holdMs: 3000,
  lightsOutMs: 4000,
  launchMs: 4400,
  logoHoldMs: 1200,
  revealDurationMs: 600,
  totalMs: 6200,
} as const;

export const START_LIGHT_CUE = "IT'S LIGHTS OUT AND AWAY WE GO!";

export function getStartLightsFrame(elapsedMs: number) {
  const time = Math.max(0, elapsedMs);
  const phase =
    time >= START_LIGHT_TIMING.totalMs
      ? 'complete'
      : time >= START_LIGHT_TIMING.launchMs
        ? 'launch'
        : time >= START_LIGHT_TIMING.lightsOutMs
          ? 'lights-out'
          : time >= START_LIGHT_TIMING.holdMs
            ? 'hold'
            : time >= START_LIGHT_TIMING.firstLightMs
              ? 'pressure'
              : 'awakening';
  const litColumns =
    time < START_LIGHT_TIMING.firstLightMs || time >= START_LIGHT_TIMING.lightsOutMs
      ? 0
      : Math.min(
          5,
          Math.floor(
            (time - START_LIGHT_TIMING.firstLightMs) / START_LIGHT_TIMING.lightIntervalMs,
          ) + 1,
        );
  return { phase, litColumns } as const;
}
