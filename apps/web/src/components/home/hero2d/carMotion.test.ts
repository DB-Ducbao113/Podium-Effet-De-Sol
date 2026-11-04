import { describe, expect, it } from 'vitest';
import { carPose, damp, heroScrollProgress, movementImpulse, normalizePointer } from './carMotion';

describe('F1 Hero V8.3 cinematic motion', () => {
  const rect = { left: 100, top: 50, width: 500, height: 200 };
  it('normalizes and bounds pointer positions', () => {
    expect(normalizePointer(350, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(normalizePointer(-1000, 9999, rect)).toEqual({ x: -1, y: 1 });
  });
  it('keeps perspective effects subtle even for out-of-range coordinates', () => {
    for (const [x, y] of [[-2, -3], [0, 0], [2, 3]]) {
      const pose = carPose(x, y);
      expect(Math.abs(pose.yaw)).toBeLessThanOrEqual(3.4);
      expect(Math.abs(pose.pitch)).toBeLessThanOrEqual(1.8);
      expect(Math.abs(pose.translateX)).toBeLessThanOrEqual(16);
      expect(Math.abs(pose.translateY)).toBeLessThanOrEqual(10);
    }
  });
  it('damps movement without overshoot', () => {
    expect(damp(0, 1, .016)).toBeGreaterThan(0);
    expect(damp(0, 1, .016)).toBeLessThan(1);
    expect(damp(.5, 0, .016)).toBeLessThan(.5);
    expect(damp(0, 1, -1)).toBe(0);
  });
  it('bounds movement energy and scroll scene progression', () => {
    expect(movementImpulse(0)).toBe(0);
    expect(movementImpulse(99)).toBe(1);
    expect(heroScrollProgress(300, 600)).toBe(0);
    expect(heroScrollProgress(-300, 600)).toBe(.5);
    expect(heroScrollProgress(-2000, 600)).toBe(1);
    expect(heroScrollProgress(-100, 0)).toBe(1);
  });
});
