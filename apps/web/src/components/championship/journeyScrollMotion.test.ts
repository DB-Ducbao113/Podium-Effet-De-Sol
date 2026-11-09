import { describe, expect, it } from 'vitest';
import { getJourneyPhase, getJourneyScrollPosition, getJourneyScrollProgress, getJourneyScrollTarget } from './journeyScrollMotion';

describe('World Tour scroll and drag interaction regression', () => {
  it('starts travelling from the first scroll pixel after the page opens', () => {
    const entryY = 220;
    expect(getJourneyScrollProgress(entryY, entryY, 600, 23)).toBe(0);
    expect(getJourneyScrollProgress(entryY + 1, entryY, 600, 23)).toBeGreaterThan(0);
    expect(getJourneyScrollProgress(entryY + 150, entryY, 600, 23)).toBeCloseTo(0.25);
  });

  it('advances by round without an artificial viewport threshold', () => {
    expect(getJourneyScrollProgress(850, 200, 650, 23)).toBe(1);
    expect(getJourneyScrollProgress(1500, 200, 650, 23)).toBe(2);
    expect(getJourneyScrollProgress(100, 200, 650, 23)).toBe(0);
    expect(getJourneyScrollProgress(50000, 200, 650, 23)).toBe(22);
  });

  it('uses the same coordinates for choosing a round and returning from its details', () => {
    const entry = 150;
    const step = 700;
    for (const roundIndex of [0, 1, 7, 15, 22]) {
      const y = getJourneyScrollTarget(entry, roundIndex, step);
      expect(getJourneyScrollProgress(y, entry, step, 23)).toBe(roundIndex);
    }
  });

  it('defends against empty seasons, zero step and non-finite inputs', () => {
    expect(getJourneyScrollProgress(1000, 200, 0, 0)).toBe(0);
    expect(getJourneyScrollProgress(Number.NaN, 0, 600, 23)).toBe(0);
    expect(getJourneyScrollProgress(20, 0, 0, 23)).toBe(20);
  });

  it('holds each destination while its vector circuit opens, then flies to the next round', () => {
    expect(getJourneyPhase(0, 23).introOpacity).toBe(1);
    expect(getJourneyPhase(0.52, 23).introOpacity).toBe(0);
    expect(getJourneyPhase(0.8, 23).trackReveal).toBe(1);
    expect(getJourneyPhase(0.8, 23).globeProgress).toBe(0);
    expect(getJourneyPhase(1.2, 23).globeProgress).toBeGreaterThan(0);
    expect(getJourneyPhase(1.5, 23).globeProgress).toBe(1);
    expect(getJourneyPhase(22.8, 23).roundIndex).toBe(22);
  });

  it('removes map markers before the vector circuit starts opening', () => {
    expect(getJourneyPhase(0.2, 23).markerOpacity).toBe(1);
    expect(getJourneyPhase(0.56, 23).markerOpacity).toBe(0);
    expect(getJourneyPhase(0.56, 23).trackReveal).toBe(0);
    expect(getJourneyPhase(0.65, 23).markerOpacity).toBe(0);
    expect(getJourneyPhase(0.65, 23).trackReveal).toBeGreaterThan(0);
  });

  it('lands jump and detail-return links on a round before its circuit reveal', () => {
    const target = getJourneyScrollTarget(150, 7, 700, 0.52);
    expect(target).toBeCloseTo(5414);
    expect(getJourneyPhase((target - 150) / 700, 23).roundIndex).toBe(7);
    expect(getJourneyPhase((target - 150) / 700, 23).trackReveal).toBe(0);
  });

  it('keeps the final round scrollable through its circuit phase', () => {
    const position = getJourneyScrollPosition(150 + 22.8 * 700, 150, 700, 23);
    expect(position).toBeCloseTo(22.8);
    expect(getJourneyPhase(position, 23).trackReveal).toBe(1);
  });
});
