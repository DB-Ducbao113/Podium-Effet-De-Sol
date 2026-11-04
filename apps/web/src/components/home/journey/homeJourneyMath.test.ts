import { describe, expect, it } from 'vitest';
import {
  HOME_CHAPTER_IDS,
  clamp01,
  getCurrentHomeChapter,
  getHomePageProgress,
  getHomeSectionProgress,
} from './homeJourneyMath';

describe('Homepage V8.4 full-page motion director', () => {
  it('locks the four existing section anchors without altering navigation', () => {
    expect(HOME_CHAPTER_IDS).toEqual([
      'launch-control', 'race-control', 'championship-overview', 'eds-explore',
    ]);
  });
  it('calculates bounded scroll progress, even on short pages', () => {
    expect(getHomePageProgress(0, 2000, 1000)).toBe(0);
    expect(getHomePageProgress(500, 2000, 1000)).toBe(.5);
    expect(getHomePageProgress(1500, 2000, 1000)).toBe(1);
    expect(getHomePageProgress(0, 500, 1000)).toBe(0);
    expect(clamp01(Number.NaN)).toBe(0);
  });
  it('returns a monotonic chapter interpolation', () => {
    expect(getHomeSectionProgress(1100, 500, 900)).toBe(0);
    expect(getHomeSectionProgress(-700, 500, 900)).toBe(1);
    expect(getHomeSectionProgress(350, 500, 900)).toBeGreaterThan(0);
  });
  it('chooses the chapter intersecting the reader focus line', () => {
    const sections = [
      { id: 'launch-control' as const, top: -600, bottom: 200 },
      { id: 'race-control' as const, top: 200, bottom: 690 },
      { id: 'championship-overview' as const, top: 690, bottom: 1200 },
      { id: 'eds-explore' as const, top: 1200, bottom: 1700 },
    ];
    expect(getCurrentHomeChapter(sections, 800)).toBe('race-control');
    expect(getCurrentHomeChapter([], 800)).toBe('launch-control');
  });
});
