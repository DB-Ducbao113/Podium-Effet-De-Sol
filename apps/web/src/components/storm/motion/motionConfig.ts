export type StormMotionIntensity = "subtle" | "luxury" | "expressive";

export interface MotionIntensityTokens {
  readonly durationScale: number;
  readonly tiltMaxDeg: number;
  readonly magneticMaxPx: number;
  readonly staggerScale: number;
  readonly beamOpacity: number;
  readonly parallaxPx: number;
}

export const STORM_MOTION_PRESETS: Readonly<
  Record<StormMotionIntensity, MotionIntensityTokens>
> = {
  subtle: {
    durationScale: 0.82,
    tiltMaxDeg: 2.0,
    magneticMaxPx: 3,
    staggerScale: 0.75,
    beamOpacity: 0.45,
    parallaxPx: 14,
  },
  luxury: {
    durationScale: 1.0,
    tiltMaxDeg: 3.5,
    magneticMaxPx: 5,
    staggerScale: 1.0,
    beamOpacity: 0.78,
    parallaxPx: 26,
  },
  expressive: {
    durationScale: 1.2,
    tiltMaxDeg: 5.5,
    magneticMaxPx: 8,
    staggerScale: 1.18,
    beamOpacity: 1.0,
    parallaxPx: 42,
  },
};

export const ROUTE_VEIL_MAX_DURATION_MS = 190;

export function isFinePointerDevice(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return !window.matchMedia("(pointer: coarse)").matches;
}

export function isEligibleForLenis(options: {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly pathname: string;
  readonly isFinePointer?: boolean;
}): boolean {
  if (!options.enabled || options.reducedMotion) return false;
  const finePointer = options.isFinePointer ?? isFinePointerDevice();
  if (!finePointer) return false;
  const normalized = options.pathname.replace(/\/+$/, "") || "/";
  if (
    normalized === "/showroom" ||
    normalized === "/engineering" ||
    normalized === "/engineering/car-anatomy"
  ) {
    return false;
  }
  return true;
}

export function clampBoundedOffset(
  deltaPx: number,
  maxPx: number,
  strength = 0.24,
): number {
  if (!Number.isFinite(deltaPx) || maxPx <= 0) return 0;
  return Math.max(-maxPx, Math.min(maxPx, deltaPx * strength));
}

export function computeCardTiltAngles(
  normX: number,
  normY: number,
  maxDeg: number,
): { readonly rotateX: number; readonly rotateY: number } {
  const cx = Math.max(-0.5, Math.min(0.5, normX - 0.5));
  const cy = Math.max(-0.5, Math.min(0.5, normY - 0.5));
  return {
    rotateX: Number((-cy * 2 * maxDeg).toFixed(2)) || 0,
    rotateY: Number((cx * 2 * maxDeg).toFixed(2)) || 0,
  };
}
