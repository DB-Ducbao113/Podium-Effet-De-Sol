import { describe, expect, it } from 'vitest';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import {
  blueprintAt,
  cameraFrameAt,
  clampProgress,
  detachmentAt,
  partDetachmentAt,
  pilotFrameAt,
  positionFromBaseline,
  sourceOffsetToYUp,
} from './pilotMotion';

describe('P1.1 cinematic wheel motion — reversible & source-correct', () => {
  it('starts and finishes assembled with exactly the original positions', () => {
    const origin = [1.25, 0.37, -0.83] as const;
    FRONT_LEFT_WHEEL_V2.forEach((part) => {
      expect(positionFromBaseline(origin, part.authoredOffsetZUp, 0, part.order)).toEqual(origin);
      expect(positionFromBaseline(origin, part.authoredOffsetZUp, 1, part.order)).toEqual(origin);
    });
    expect(detachmentAt(0)).toBe(0);
    expect(detachmentAt(0.54)).toBe(1);
    expect(detachmentAt(1)).toBe(0);
  });

  it('remains reversible for arbitrary seeks and all seven parts', () => {
    const initial = [0, 0.25, -0.78] as const;
    for (const p of [0, 0.07, 0.29, 0.51, 0.63, 0.78, 0.92, 1]) {
      FRONT_LEFT_WHEEL_V2.forEach((part) => {
        const pose = positionFromBaseline(initial, part.authoredOffsetZUp, p, part.order);
        const repeated = positionFromBaseline(initial, part.authoredOffsetZUp, p, part.order);
        expect(pose).toEqual(repeated);
        expect(pose.every(Number.isFinite)).toBe(true);
      });
    }
  });

  it('separates parts in chronological order, all reaching 1 in the held phase', () => {
    const phase = FRONT_LEFT_WHEEL_V2.map(({ order }) => partDetachmentAt(0.30, order));
    expect(phase[0]).toBeGreaterThan(phase[1]);
    for (let i = 1; i < phase.length - 1; i++) expect(phase[i]).toBeGreaterThanOrEqual(phase[i + 1]);
    FRONT_LEFT_WHEEL_V2.forEach(({ order }) => expect(partDetachmentAt(0.69, order)).toBe(1));
  });

  it('only uses blueprint in the technical chapter and returns to cinematic', () => {
    expect(blueprintAt(0)).toBe(0);
    expect(blueprintAt(0.54)).toBe(0);
    expect(blueprintAt(0.69)).toBe(1);
    expect(blueprintAt(0.80)).toBe(1);
    expect(blueprintAt(1)).toBe(0);
  });

  it('does not jump the camera at keyframes', () => {
    for (const boundary of [0.18, 0.37, 0.60, 0.77]) {
      const before = cameraFrameAt(boundary - 0.000001);
      const after = cameraFrameAt(boundary + 0.000001);
      before.position.forEach((coordinate, axis) => {
        expect(Math.abs(coordinate - after.position[axis])).toBeLessThan(0.0001);
        expect(Math.abs(before.target[axis] - after.target[axis])).toBeLessThan(0.0001);
      });
    }
  });

  it('converts all vectors from source +Z-up to glTF +Y-up', () => {
    expect(sourceOffsetToYUp([0, 0.34, 0])).toEqual([0, 0, -0.34]);
    expect(sourceOffsetToYUp([0, -0.34, 0])).toEqual([0, 0, 0.34]);
    expect(sourceOffsetToYUp([0, 0, -0.54])).toEqual([0, -0.54, -0]);
  });

  it('handles out-of-range and invalid scrubs without NaN', () => {
    expect(clampProgress(-5)).toBe(0);
    expect(clampProgress(Infinity)).toBe(0);
    expect(pilotFrameAt(NaN).progress).toBe(0);
    expect(pilotFrameAt(2).progress).toBe(1);
    expect(pilotFrameAt(1).cameraPosition.every(Number.isFinite)).toBe(true);
  });
});
