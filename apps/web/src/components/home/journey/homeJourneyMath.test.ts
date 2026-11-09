import { describe, expect, it } from 'vitest';
import {
  HOME_CHAPTER_IDS,
  clamp01,
  dampProgress,
  getCurrentHomeChapter,
  getHomePageProgress,
  getHomePinnedProgress,
  getHomeSectionProgress,
  smoothstep,
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
    expect(getCurrentHomeChapter(sections, 800)).toBe('launch-control');
    expect(getCurrentHomeChapter(sections.map((section) => ({ ...section, top: section.top - 200, bottom: section.bottom - 200 })), 800)).toBe('race-control');
    expect(getCurrentHomeChapter([], 800)).toBe('launch-control');
  });
});

describe('Pinned chapter scroll scrub', () => {
  it('maps the tall frame traversal onto a bounded 0..1 progress', () => {
    expect(getHomePinnedProgress(0, 2700, 900)).toBe(0);
    expect(getHomePinnedProgress(-900, 2700, 900)).toBe(.5);
    expect(getHomePinnedProgress(-1800, 2700, 900)).toBe(1);
    expect(getHomePinnedProgress(400, 2700, 900)).toBe(0);
    expect(getHomePinnedProgress(-5000, 2700, 900)).toBe(1);
  });
  it('never divides by zero when the frame is shorter than the viewport', () => {
    expect(getHomePinnedProgress(0, 500, 900)).toBe(0);
    expect(getHomePinnedProgress(-10, 900, 900)).toBe(1);
    expect(getHomePinnedProgress(Number.NaN, 2700, 900)).toBe(0);
  });
  it('smoothstep stays bounded, monotonic and hits its edges exactly', () => {
    expect(smoothstep(.12, .92, 0)).toBe(0);
    expect(smoothstep(.12, .92, 1)).toBe(1);
    expect(smoothstep(.12, .92, .52)).toBeCloseTo(.5, 5);
    expect(smoothstep(.12, .92, .3)).toBeLessThan(smoothstep(.12, .92, .6));
    expect(smoothstep(.5, .5, .9)).toBe(1);
  });
  it('damping converges toward the target without overshooting', () => {
    let value = 0;
    for (let i = 0; i < 120; i += 1) value = dampProgress(value, 1, 16.667);
    expect(value).toBeGreaterThan(.999);
    expect(value).toBeLessThanOrEqual(1);
    expect(dampProgress(.4, .4, 16.667)).toBe(.4);
    expect(dampProgress(0, 1, 0)).toBe(0);
    expect(dampProgress(0, 1, 500)).toBeLessThanOrEqual(1);
  });
});
