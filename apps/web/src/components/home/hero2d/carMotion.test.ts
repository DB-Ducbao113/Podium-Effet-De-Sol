import { describe, expect, it } from 'vitest';
import { carPose, damp, normalizePointer } from './carMotion';

describe('F1 Hero 2.5D pointer choreography', () => {
  const rect = { left: 100, top: 50, width: 500, height: 200 };
  it('normalizes pointer to stable bounded coordinates', () => {
    expect(normalizePointer(350, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(normalizePointer(-1000, 9999, rect)).toEqual({ x: -1, y: 1 });
  });
  it('never exceeds the art-directed tilt envelope', () => {
    for (const [x, y] of [[-1,-1], [0,0], [1,1]]) {
      const pose = carPose(x, y);
      expect(Math.abs(pose.yaw)).toBeLessThanOrEqual(3.1);
      expect(Math.abs(pose.pitch)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(pose.translateX)).toBeLessThanOrEqual(12);
      expect(Math.abs(pose.translateY)).toBeLessThanOrEqual(8);
    }
  });
  it('damps toward the target without overshoot', () => {
    expect(damp(0, 1, .016)).toBeGreaterThan(0);
    expect(damp(0, 1, .016)).toBeLessThan(1);
    expect(damp(.5, 0, .016)).toBeLessThan(.5);
  });
});
