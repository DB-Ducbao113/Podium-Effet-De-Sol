import type { TextZoomLevel } from '../hooks/useTextZoomAttribute';

/**
 * off   — motion must not run (reduced-motion preference or hidden tab).
 * lite  — run, but with short travel and no long staggers.
 * full  — the complete choreography.
 */
export type MotionTier = 'off' | 'lite' | 'full';

export type DeviceCapability = {
  saveData: boolean;
  deviceMemory: number;
};

export type MotionEnvironment = DeviceCapability & {
  reducedMotion: boolean;
  visible: boolean;
  textZoom: TextZoomLevel;
};

export const LOW_POWER_DEVICE_MEMORY = 4;
export const UNKNOWN_DEVICE_MEMORY = 8;

const NEUTRAL: MotionEnvironment = {
  reducedMotion: true,
  visible: false,
  saveData: false,
  deviceMemory: UNKNOWN_DEVICE_MEMORY,
  textZoom: 'normal',
};

export function isLowPowerDevice(env: DeviceCapability): boolean {
  return env.saveData || env.deviceMemory <= LOW_POWER_DEVICE_MEMORY;
}

export function getMotionTier(env: MotionEnvironment): MotionTier {
  if (env.reducedMotion || !env.visible) return 'off';
  if (isLowPowerDevice(env) || env.textZoom === '400') return 'lite';
  return 'full';
}

/** Essential page reveals opt out entirely on low-power hardware, whatever the tier. */
export function mayRunEssentialReveal(env: MotionEnvironment): boolean {
  return !env.reducedMotion && env.visible && !isLowPowerDevice(env);
}

/** Prerender and Vitest run without a DOM, so the server-side answer is "no motion". */
export function readMotionEnvironment(): MotionEnvironment {
  if (typeof window === 'undefined' || typeof document === 'undefined') return NEUTRAL;
  const zoom = document.documentElement.dataset.textZoom;
  return {
    ...readDeviceCapability(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    visible: !document.hidden,
    textZoom: zoom === '200' || zoom === '400' ? zoom : 'normal',
  };
}

export function readDeviceCapability(): DeviceCapability {
  if (typeof navigator === 'undefined') {
    return { saveData: false, deviceMemory: UNKNOWN_DEVICE_MEMORY };
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    saveData: nav.connection?.saveData === true,
    deviceMemory: nav.deviceMemory ?? UNKNOWN_DEVICE_MEMORY,
  };
}
