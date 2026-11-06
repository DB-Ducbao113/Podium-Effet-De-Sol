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
  CENTER_LOCK_PRESENTATION_OFFSET_Z_UP,
  P1_PART_MOTION_PHASES,
  centerLockTurnAt,
  presentationOffsetFor,
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
    const phase = FRONT_LEFT_WHEEL_V2.map(({ order }) => partDetachmentAt(0.39, order));
    expect(phase[0]).toBeGreaterThan(phase[1]);
    for (let i = 1; i < phase.length - 1; i++) expect(phase[i]).toBeGreaterThanOrEqual(phase[i + 1]);
    FRONT_LEFT_WHEEL_V2.forEach(({ order }) => expect(partDetachmentAt(0.69, order)).toBe(1));
  });


  it('turns the nut before extracting it and the wheel, without racing the wheel', () => {
    expect(centerLockTurnAt(0.25)).toBe(0);
    expect(centerLockTurnAt(0.30)).toBeGreaterThan(0.1);
    expect(partDetachmentAt(0.30, 0)).toBe(0);
    expect(partDetachmentAt(0.39, 0)).toBeGreaterThan(0.8);
    expect(partDetachmentAt(0.39, 1)).toBe(0);
    expect(partDetachmentAt(0.45, 0)).toBe(1);
    expect(partDetachmentAt(0.45, 1)).toBeGreaterThan(0);
    expect(centerLockTurnAt(0.54)).toBe(1);
  });

  it('seats the wheel before the lock, and only then retightens', () => {
    expect(partDetachmentAt(0.93, 1)).toBeGreaterThan(0);
    expect(partDetachmentAt(0.93, 0)).toBe(1);
    expect(partDetachmentAt(0.955, 1)).toBe(0);
    expect(partDetachmentAt(0.955, 0)).toBe(1);
    expect(centerLockTurnAt(0.955)).toBe(1);
    expect(partDetachmentAt(0.985, 0)).toBe(0);
    expect(centerLockTurnAt(0.985)).toBeLessThan(1);
    expect(centerLockTurnAt(1)).toBe(0);
    expect(P1_PART_MOTION_PHASES).toHaveLength(7);
  });

  it('keeps manifest offsets immutable while clearing the front face of the outer wheel', () => {
    const source = FRONT_LEFT_WHEEL_V2[0].authoredOffsetZUp;
    expect(source).toEqual([0, 0.34, 0]);
    const proposed = presentationOffsetFor(source, 0);
    expect(proposed).toEqual(CENTER_LOCK_PRESENTATION_OFFSET_Z_UP);
    expect(proposed).toEqual([0, 0.84, 0]);
    expect(presentationOffsetFor(FRONT_LEFT_WHEEL_V2[1].authoredOffsetZUp, 1))
      .toEqual([0, 0.66, 0]);
    // Bounds from real BALANCED GLB / verified separately by offline geometry audit.
    const nutInboardFace = -0.9744441956281663;
    const tireOutboardFace = -1.031437873840332;
    const clearance = (tireOutboardFace - 0.66) - (nutInboardFace - proposed[1]);
    expect(clearance).toBeGreaterThan(0.12);
    expect(clearance).toBeLessThan(0.15);
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
