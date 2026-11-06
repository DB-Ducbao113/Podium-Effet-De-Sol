import { describe, expect, it } from 'vitest';
import {
  FRONT_LEFT_R45_PIVOT_Y_UP,
  FRONT_LEFT_R45_PIVOT_Z_UP,
  FRONT_LEFT_WHEEL_SHOTS,
  sourceZUpToThreeYUp,
  wheelShotAt,
} from './frontLeftWheelShots';

describe('P1.0 cinematic wheel-camera storyboard', () => {
  it('uses the source-authored R4.5 pivot with correct GLB Y-up coordinate conversion', () => {
    expect(sourceZUpToThreeYUp(FRONT_LEFT_R45_PIVOT_Z_UP)).toEqual(FRONT_LEFT_R45_PIVOT_Y_UP);
    expect(FRONT_LEFT_R45_PIVOT_Y_UP[0]).toBeCloseTo(1.2527518272, 8);
    expect(FRONT_LEFT_R45_PIVOT_Y_UP[1]).toBeCloseTo(0.3711177111, 8);
    expect(FRONT_LEFT_R45_PIVOT_Y_UP[2]).toBeCloseTo(-0.8302745819, 8);
  });

  it('defines 6 contiguous storyboard shots covering the full reversible 0..1 interval', () => {
    expect(FRONT_LEFT_WHEEL_SHOTS).toHaveLength(6);
    expect(FRONT_LEFT_WHEEL_SHOTS[0].timeRange[0]).toBe(0);
    expect(FRONT_LEFT_WHEEL_SHOTS.at(-1)?.timeRange[1]).toBe(1);
    FRONT_LEFT_WHEEL_SHOTS.forEach((shot, index) => {
      expect(shot.timeRange[1]).toBeGreaterThan(shot.timeRange[0]);
      if (index > 0) {
        expect(shot.timeRange[0]).toBe(FRONT_LEFT_WHEEL_SHOTS[index - 1].timeRange[1]);
      }
      expect(shot.camera.distance).toBeGreaterThan(0);
      expect(shot.camera.target.every(Number.isFinite)).toBe(true);
      expect(shot.camera.direction.every(Number.isFinite)).toBe(true);
    });
  });

  it('selects one deterministic shot at boundaries, including invalid progress', () => {
    expect(wheelShotAt(-4).id).toBe('hero');
    expect(wheelShotAt(0.12).id).toBe('axis');
    expect(wheelShotAt(0.25).id).toBe('exploded');
    expect(wheelShotAt(0.54).id).toBe('blueprint');
    expect(wheelShotAt(0.69).id).toBe('macro');
    expect(wheelShotAt(0.86).id).toBe('rebuild');
    expect(wheelShotAt(1).id).toBe('rebuild');
    expect(wheelShotAt(NaN).id).toBe('hero');
  });

  it('does not silently imply real telemetry or verified mount fitment', () => {
    expect(FRONT_LEFT_WHEEL_SHOTS.every((shot) => !shot.title.en.includes('km/h'))).toBe(true);
    expect(FRONT_LEFT_WHEEL_SHOTS.find((shot) => shot.id === 'macro')?.visualGate).toContain('unsupported');
  });
});
