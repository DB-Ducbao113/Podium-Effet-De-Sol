/** V9: shared chapter coordinates and pointer state. No fake CFD or race telemetry. */
export const WORLD_CHAPTERS = [
  { id: 'launch-control', label: 'IGNITION' },
  { id: 'race-control', label: 'RACE CONTROL' },
  { id: 'championship-overview', label: 'TITLE FIGHT' },
  { id: 'eds-engineering', label: 'INSIDE THE MACHINE' },
  { id: 'eds-explore', label: 'EXPLORE' },
  { id: 'peds-credits', label: 'THE LEGACY' },
] as const;

export type WorldChapterId = (typeof WORLD_CHAPTERS)[number]['id'];
export type WorldQuality = 'high' | 'balanced' | 'low' | 'static';
export type WorldLabMode = 'pressure' | 'velocity' | 'carbon' | null;

export interface WorldController {
  phase: number;
  pointerX: number;
  pointerY: number;
  pointerSpeed: number;
  quality: Exclude<WorldQuality, 'static'>;
  lab: WorldLabMode;
}

export type WorldAnchor = { id: string; top: number; height: number };

export const limit = (value: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, Number.isFinite(value) ? value : lo));

export function normalizeWorldPointer(x: number, y: number, width: number, height: number) {
  return {
    x: limit((x / Math.max(width, 1) - .5) * 2, -1, 1),
    y: limit((.5 - y / Math.max(height, 1)) * 2, -1, 1),
  };
}

/**
 * Dynamic DOM anchors, not rigid scroll percentages.
 * The reader's focus line moves between the centers of real chapter sections,
 * even when fonts, race data or content height change.
 */
export function resolveWorldPhase(anchors: ReadonlyArray<WorldAnchor>, viewportHeight: number): number {
  const found = WORLD_CHAPTERS.map((c, index) => {
    const section = anchors.find((anchor) => anchor.id === c.id);
    return section ? { index, center: section.top + section.height / 2 } : null;
  }).filter((v): v is { index: number; center: number } => v !== null);
  if (!found.length) return 0;
  const focus = viewportHeight * .52;
  if (focus <= found[0].center) return found[0].index;
  for (let i = 0; i < found.length - 1; i++) {
    const current = found[i];
    const next = found[i + 1];
    if (focus <= next.center) {
      const ratio = limit((focus - current.center) / Math.max(next.center - current.center, 1), 0, 1);
      return current.index + (next.index - current.index) * ratio;
    }
  }
  return found[found.length - 1].index;
}

export function mixWorldFrames(phase: number, frames: readonly number[]): number {
  if (!frames.length) return 0;
  const value = limit(phase, 0, frames.length - 1);
  const index = Math.floor(value);
  return frames[index] + ((frames[Math.min(index + 1, frames.length - 1)] - frames[index]) * (value - index));
}

export function smoothWorldValue(current: number, target: number, delta: number, damping = 4.8): number {
  return current + (target - current) * (1 - Math.exp(-damping * limit(delta, 0, .05)));
}

export function getVisualWeights(phase: number, lab: WorldLabMode) {
  if (lab) return {
    pressure: lab === 'pressure' ? 1 : 0,
    velocity: lab === 'velocity' ? 1 : 0,
    carbon: lab === 'carbon' ? 1 : 0,
  };
  return {
    pressure: mixWorldFrames(phase, [1, .35, .25, .48, .25, .74]),
    velocity: mixWorldFrames(phase, [.95, .9, .5, .5, .8, .62]),
    carbon: mixWorldFrames(phase, [.22, .45, .65, 1, .92, .83]),
  };
}
