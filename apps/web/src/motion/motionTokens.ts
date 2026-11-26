/** Mirrors the --peds-motion-* scale declared in src/index.css. */
export type MotionSpeed = 'fast' | 'base' | 'slow';

const FALLBACK_MS: Record<MotionSpeed, number> = { fast: 140, base: 240, slow: 420 };

/**
 * Durations are read from the cascade, not re-declared, so a CSS retune can never
 * leave a JS timeline running a stale length — the defect class behind the
 * page-transition overlay timer.
 */
export function motionDurationS(speed: MotionSpeed): number {
  const fallback = FALLBACK_MS[speed] / 1000;
  if (typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--peds-motion-${speed}`);
  const ms = Number.parseFloat(raw);
  return Number.isFinite(ms) && ms >= 0 ? ms / 1000 : fallback;
}

/** GSAP equivalents of --peds-ease-standard and --peds-ease-emphasis. */
export const EASE = {
  standard: 'power3.out',
  emphasis: 'expo.out',
  enter: 'power2.out',
  exit: 'power2.in',
} as const;

/** Exits run at ~65% of the matching entrance so states never feel laggy. */
export const EXIT_RATIO = 0.65;

/** Per-item reveal offset, inside the 30-50ms guidance band. */
export const STAGGER_S = 0.04;
