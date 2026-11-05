/** Scroll-to-Grand-Prix mapping. Zero is the moment Journey opens, not a delayed viewport gate. */
export function getJourneyScrollProgress(
  currentScrollY: number,
  entryScrollY: number,
  pixelsPerRound: number,
  roundCount: number,
): number {
  if (roundCount < 2 || !Number.isFinite(currentScrollY) || !Number.isFinite(entryScrollY)) return 0;
  const travel = (currentScrollY - entryScrollY) / Math.max(1, pixelsPerRound);
  return Math.max(0, Math.min(roundCount - 1, travel));
}

export function getJourneyScrollTarget(
  entryScrollY: number,
  index: number,
  pixelsPerRound: number,
): number {
  return Math.max(0, entryScrollY + Math.max(0, index) * Math.max(1, pixelsPerRound));
}
