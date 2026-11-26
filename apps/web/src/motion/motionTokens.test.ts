import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXIT_RATIO, STAGGER_S, motionDurationS } from './motionTokens';
import type { MotionSpeed } from './motionTokens';

const css = readFileSync('src/index.css', 'utf8');
const declared = (speed: MotionSpeed) => {
  const raw = css.match(new RegExp(`--peds-motion-${speed}:\\s*([\\d.]+)ms`))?.[1];
  if (!raw) throw new Error(`--peds-motion-${speed} is missing from index.css`);
  return Number(raw) / 1000;
};

describe('motion tokens', () => {
  it('falls back to exactly the durations declared in the cascade', () => {
    // Without this, a CSS retune silently leaves JS timelines on the old length.
    for (const speed of ['fast', 'base', 'slow'] as const) {
      expect(motionDurationS(speed)).toBe(declared(speed));
    }
    expect(motionDurationS('slow')).toBeCloseTo(0.42);
  });

  it('keeps exits shorter than entrances and staggers inside the guidance band', () => {
    expect(EXIT_RATIO).toBeGreaterThan(0.5);
    expect(EXIT_RATIO).toBeLessThan(1);
    expect(STAGGER_S * 1000).toBeGreaterThanOrEqual(30);
    expect(STAGGER_S * 1000).toBeLessThanOrEqual(50);
  });
});
