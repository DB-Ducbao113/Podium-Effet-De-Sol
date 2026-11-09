export const HOME_CHAPTER_IDS = [
  'launch-control',
  'race-control',
  'championship-overview',
  'eds-explore',
] as const;

export type HomeChapter = (typeof HOME_CHAPTER_IDS)[number];

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function getHomePageProgress(scrollY: number, documentHeight: number, viewportHeight: number) {
  return clamp01(scrollY / Math.max(1, documentHeight - viewportHeight));
}

export function getHomeSectionProgress(sectionTop: number, sectionHeight: number, viewportHeight: number) {
  return clamp01((viewportHeight * .72 - sectionTop) / Math.max(1, sectionHeight + viewportHeight * .28));
}

/** Scroll-scrub progress of a pinned chapter: 0 when its tall frame top hits the viewport top, 1 when the frame is consumed. `pinnedHeight` is the sticky stage height, measured in the same coordinate space as `frameTop`/`frameHeight` so root CSS zoom cancels out. */
export function getHomePinnedProgress(frameTop: number, frameHeight: number, pinnedHeight: number) {
  return clamp01(-frameTop / Math.max(1, frameHeight - pinnedHeight));
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  if (edge1 === edge0) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Frame-rate independent damping toward the scroll target; converges instead of looping forever. */
export function dampProgress(current: number, target: number, deltaMs: number) {
  const k = 1 - Math.pow(1 - .18, Math.min(Math.max(deltaMs, 0), 80) / 16.667);
  return current + (target - current) * k;
}

export function getCurrentHomeChapter(
  sections: ReadonlyArray<{ id: HomeChapter; top: number; bottom: number }>,
  viewportHeight: number,
): HomeChapter {
  const focus = viewportHeight * .12;
  const current = sections.find((section) => section.top <= focus && section.bottom > focus);
  if (current) return current.id;
  if (!sections.length) return 'launch-control';
  return sections.reduce((closest, item) => {
    const distance = Math.min(Math.abs(item.top - focus), Math.abs(item.bottom - focus));
    const closestDistance = Math.min(Math.abs(closest.top - focus), Math.abs(closest.bottom - focus));
    return distance < closestDistance ? item : closest;
  }).id;
}
