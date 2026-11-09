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

export function getJourneyScrollPosition(
  currentScrollY: number,
  entryScrollY: number,
  pixelsPerRound: number,
  roundCount: number,
): number {
  if (roundCount < 1 || !Number.isFinite(currentScrollY) || !Number.isFinite(entryScrollY)) return 0;
  const position = (currentScrollY - entryScrollY) / Math.max(1, pixelsPerRound);
  return Math.max(0, Math.min(roundCount - 0.001, position));
}

export function getJourneyScrollTarget(
  entryScrollY: number,
  index: number,
  pixelsPerRound: number,
  phase = 0,
): number {
  return Math.max(0, entryScrollY + (Math.max(0, index) + Math.max(0, Math.min(1, phase))) * Math.max(1, pixelsPerRound));
}

const smooth = (start: number, end: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

/** Each round keeps the globe in view, then reveals its vector circuit before the next flight. */
export function getJourneyPhase(position: number, roundCount: number) {
  if (roundCount < 1 || !Number.isFinite(position)) {
    return { roundIndex: 0, globeProgress: 0, trackReveal: 0, introOpacity: 1, markerOpacity: 1 };
  }
  const bounded = Math.max(0, Math.min(roundCount - 0.001, position));
  const roundIndex = Math.floor(bounded);
  const local = bounded - roundIndex;
  const flight = smooth(0.02, 0.45, local);
  return {
    roundIndex,
    globeProgress: roundIndex === 0 ? 0 : roundIndex - 1 + flight,
    trackReveal: smooth(0.58, 0.73, local) * (1 - smooth(0.88, 0.99, local)),
    markerOpacity: (roundIndex === 0 ? 1 : smooth(0, 0.08, local)) * (1 - smooth(0.43, 0.56, local)),
    introOpacity: roundIndex === 0 ? 1 - smooth(0.04, 0.38, local) : 0,
  };
}
