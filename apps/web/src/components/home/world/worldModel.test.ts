import { describe, expect, it } from 'vitest';
import {
  WORLD_CHAPTERS, getVisualWeights, limit, mixWorldFrames, normalizeWorldPointer,
  resolveWorldPhase, smoothWorldValue,
} from './worldModel';
import { selectWorldQuality } from './worldQuality';

describe('V9 single world narrative director', () => {
  const chapters = WORLD_CHAPTERS.map((chapter, i) => ({
    id: chapter.id, top: i * 800 - 3000, height: 800,
  }));
  it('includes Footer as a sixth chapter outside HomeView', () => {
    expect(WORLD_CHAPTERS.map((c) => c.id)).toEqual([
      'launch-control', 'race-control', 'championship-overview',
      'eds-engineering', 'eds-explore', 'peds-credits',
    ]);
  });
  it('interpolates over real DOM positions, including the final Footer', () => {
    expect(resolveWorldPhase([], 800)).toBe(0);
    expect(resolveWorldPhase(chapters, 800)).toBeGreaterThan(3);
    expect(resolveWorldPhase(chapters, 800)).toBeLessThan(5);
    const shifted = chapters.map((c) => ({ ...c, top: c.top - 9000 }));
    expect(resolveWorldPhase(shifted, 800)).toBe(5);
    expect(resolveWorldPhase(chapters.map((c) => ({ ...c, top: c.top + 9000 })), 800)).toBe(0);
  });
  it('bounds pointer and studio weights', () => {
    expect(normalizeWorldPointer(500, 250, 1000, 500)).toEqual({ x: 0, y: 0 });
    expect(normalizeWorldPointer(-999, 999, 1000, 500)).toEqual({ x: -1, y: -1 });
    expect(mixWorldFrames(2.5, [0, .2, .4, .8])).toBeCloseTo(.6);
    for (const lab of ['pressure', 'velocity', 'carbon'] as const) {
      const w = getVisualWeights(2.2, lab);
      expect(Object.values(w).filter((n) => n === 1)).toHaveLength(1);
    }
    expect(Object.values(getVisualWeights(5, null)).every((n) => n >= 0 && n <= 1)).toBe(true);
    expect(limit(Number.NaN, -1, 1)).toBe(-1);
  });
  it('smooths motion using delta seconds, without overshoot', () => {
    expect(smoothWorldValue(0, 1, .016)).toBeGreaterThan(0);
    expect(smoothWorldValue(0, 1, .016)).toBeLessThan(1);
    expect(smoothWorldValue(1, 0, .016)).toBeLessThan(1);
  });
});

describe('V9 adaptive GPU gates', () => {
  const base = { reducedMotion: false, saveData: false, webgl2: true, width: 1920 };
  it('uses a static presentation for motion preference, no WebGL, data saver and mobile', () => {
    expect(selectWorldQuality({ ...base, reducedMotion: true })).toBe('static');
    expect(selectWorldQuality({ ...base, webgl2: false })).toBe('static');
    expect(selectWorldQuality({ ...base, saveData: true })).toBe('static');
    expect(selectWorldQuality({ ...base, width: 390 })).toBe('static');
    expect(selectWorldQuality({ ...base, memoryGB: 2 })).toBe('static');
  });
  it('scales between low, balanced and high', () => {
    expect(selectWorldQuality({ ...base, memoryGB: 4 })).toBe('low');
    expect(selectWorldQuality({ ...base, width: 1024 })).toBe('low');
    expect(selectWorldQuality({ ...base, width: 1366 })).toBe('balanced');
    expect(selectWorldQuality(base)).toBe('high');
  });
});
