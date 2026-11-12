import { describe, expect, it } from 'vitest';
import { getV5HeroMotion } from './homeV5Motion';
import { readFileSync } from 'node:fs';

describe('Home V5 scroll and asset contract', () => {
  it('starts at the first cinematic frame and ends at the third', () => {
    const first = getV5HeroMotion(64, 1800, 900);
    const middle = getV5HeroMotion(-420, 1800, 900);
    const last = getV5HeroMotion(-2000, 1800, 900);
    expect(first.scene).toBe(1);
    expect(first.progress).toBe(0);
    expect(first.first).toBe(1);
    expect(middle.scene).toBe(2);
    expect(middle.second).toBeGreaterThan(0.8);
    expect(last.scene).toBe(3);
    expect(last.third).toBe(1);
    expect(last.shift).toBeLessThanOrEqual(18);
  });

  it('is reversible, clamps overscroll and disables scenes on compact/reduced devices', () => {
    const top = getV5HeroMotion(64, 1800, 900);
    const far = getV5HeroMotion(-4000, 1800, 900);
    const back = getV5HeroMotion(64, 1800, 900);
    expect(far.progress).toBe(1);
    expect(back).toEqual(top);
    expect(getV5HeroMotion(-4000, 1800, 900, true)).toEqual({
      progress: 0, scene: 1, first: 1, second: 0, third: 0, shift: 0,
    });
  });

  it('uses repo assets and keeps the existing showroom and verified data boundaries', () => {
    const home = readFileSync('src/components/home/HomeView.tsx', 'utf8');
    const stage = readFileSync('src/components/home/hero2d/F1HeroStage.tsx', 'utf8');
    const stylesheet = readFileSync('src/components/home/homeCinematicV5.css', 'utf8');
    expect(home).toContain('data-home-v5-scroll');
    expect(home).toContain('/images/home/explore/engineering.webp');
    expect(home).toContain('engineering-flow.svg');
    expect(stage).toContain('/media/homepage/f1-hero/peds-aero01-car.webp');
    expect(stage).toContain('peds-aero01-fallback.svg');
    expect(home).not.toContain('ModelBShowroom');
    expect(stylesheet).toContain('object-fit: contain');
    expect(stylesheet).not.toMatch(/scale\(1\.[2-9]/);
  });
});
