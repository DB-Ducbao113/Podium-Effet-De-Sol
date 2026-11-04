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

export function getCurrentHomeChapter(
  sections: ReadonlyArray<{ id: HomeChapter; top: number; bottom: number }>,
  viewportHeight: number,
): HomeChapter {
  const focus = viewportHeight * .42;
  const current = sections.find((section) => section.top <= focus && section.bottom > focus);
  if (current) return current.id;
  if (!sections.length) return 'launch-control';
  return sections.reduce((closest, item) => {
    const distance = Math.min(Math.abs(item.top - focus), Math.abs(item.bottom - focus));
    const closestDistance = Math.min(Math.abs(closest.top - focus), Math.abs(closest.bottom - focus));
    return distance < closestDistance ? item : closest;
  }).id;
}
