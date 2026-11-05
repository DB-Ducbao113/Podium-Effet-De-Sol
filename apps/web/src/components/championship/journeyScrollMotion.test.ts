import { describe, expect, it } from 'vitest';
import { getJourneyScrollProgress, getJourneyScrollTarget } from './journeyScrollMotion';

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
});
