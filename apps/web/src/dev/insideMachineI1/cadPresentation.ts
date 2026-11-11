import type { CadRenderMode } from "./types";

/** Ordered technical rendering modes for Model B R5 interactive inspection. */
export const CAD_RENDER_MODES: readonly CadRenderMode[] = [
  "pbr",
  "hybrid",
  "wireframe",
];

/** Crease threshold angle (degrees) used for Three.js CAD edge wireframe extraction. */
export const CAD_EDGE_THRESHOLD_DEG = 22;

/** Full forward or reverse Auto-Tour timeline duration across all 46 beats. */
export const AUTO_TOUR_DURATION_MS = 24000;

/** Cycles through PBR -> PBR+CAD -> CAD Wireframe cleanly. */
export function nextCadRenderMode(current: CadRenderMode): CadRenderMode {
  const index = CAD_RENDER_MODES.indexOf(current);
  return CAD_RENDER_MODES[(index + 1) % CAD_RENDER_MODES.length];
}

/**
 * Computes deterministic start, target and proportional duration for an
 * Anime.js-driven Auto-Tour sweep, restarting cleanly at boundaries.
 */
export function computeAutoTourPlan(
  currentProgress: number,
  dir: 1 | -1,
  reducedMotion = false,
): { start: number; end: number; duration: number } {
  let start = Math.max(0, Math.min(1, currentProgress));
  if (dir > 0 && start >= 0.995) start = 0;
  if (dir < 0 && start <= 0.005) start = 1;
  const end = dir > 0 ? 1 : 0;
  const baseMs = reducedMotion ? 2500 : AUTO_TOUR_DURATION_MS;
  const duration = Math.max(400, Math.round(Math.abs(end - start) * baseMs));
  return { start, end, duration };
}

export interface HierarchyVisibilityNode {
  visible: boolean;
  parent: HierarchyVisibilityNode | null;
}

/** Verifies an object and every ancestor up to `stopAt` are visible. */
export function isSubtreeVisible<T extends HierarchyVisibilityNode>(
  node: T | null,
  stopAt?: T,
): boolean {
  let cur: HierarchyVisibilityNode | null = node;
  while (cur) {
    if (!cur.visible) return false;
    if (stopAt && cur === stopAt) break;
    cur = cur.parent;
  }
  return true;
}

/**
 * Resolves the clicked/hovered semantic component ID from ordered raycaster hits.
 * In opaque PBR modes without cutaway, occluded internal components behind solid bodywork
 * are ignored; in CAD Wireframe or Cutaway modes, rays pick straight through into internals.
 */
export function resolvePickComponentId<T extends HierarchyVisibilityNode>(
  hits: ReadonlyArray<{ object: T }>,
  getComponentId: (obj: T) => string | undefined,
  options: { modelRoot: T; renderMode: CadRenderMode; cutaway: boolean },
): string | null {
  if (!hits.length) return null;
  const canSeeThrough = options.renderMode === "wireframe" || options.cutaway;
  if (canSeeThrough) {
    for (const hit of hits) {
      if (!isSubtreeVisible(hit.object, options.modelRoot)) continue;
      const id = getComponentId(hit.object);
      if (id) return id;
    }
    return null;
  }
  const firstVisible = hits.find((hit) =>
    isSubtreeVisible(hit.object, options.modelRoot),
  );
  return firstVisible ? (getComponentId(firstVisible.object) ?? null) : null;
}
