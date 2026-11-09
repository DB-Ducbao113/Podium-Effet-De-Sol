export const AERO_SECTION_IDS = ['launch-control', 'race-control', 'championship-overview', 'eds-explore'] as const;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Stable for reverse scroll, resize and refresh at any position. */
export function getAeroPhase(anchors: readonly number[], scrollY: number): number {
  if (anchors.length < 2 || !Number.isFinite(scrollY)) return 0;
  for (let i = 1; i < anchors.length; i++) {
    if (scrollY < anchors[i]) {
      const span = Math.max(1, anchors[i] - anchors[i - 1]);
      return clamp(i - 1 + (scrollY - anchors[i - 1]) / span, 0, anchors.length - 1);
    }
  }
  return anchors.length - 1;
}

export function getAeroEnergy(phase: number): number {
  const stops = [0.86, 0.48, 0.96, 0.33];
  const i = clamp(Math.floor(phase), 0, stops.length - 1);
  const t = clamp(phase - i, 0, 1);
  const ease = t * t * (3 - 2 * t);
  return stops[i] + (stops[Math.min(i + 1, stops.length - 1)] - stops[i]) * ease;
}
