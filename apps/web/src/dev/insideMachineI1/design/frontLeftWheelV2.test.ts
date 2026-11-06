import { describe, expect, it } from 'vitest';
import {
  ENGINEERING_V2_PALETTE,
  FRONT_LEFT_WHEEL_LOOKDEV,
  FRONT_LEFT_WHEEL_V2,
} from './frontLeftWheelV2';

describe('Inside the Machine V2 — front left wheel design contract', () => {
  it('covers all seven unique authored R4.5 wheel-component identifiers', () => {
    expect(FRONT_LEFT_WHEEL_V2).toHaveLength(7);
    expect(new Set(FRONT_LEFT_WHEEL_V2.map((part) => part.id)).size).toBe(7);
    expect(new Set(FRONT_LEFT_WHEEL_V2.map((part) => part.node)).size).toBe(7);
    expect(FRONT_LEFT_WHEEL_V2.every((part) => part.id.startsWith('FRONT_LEFT_WHEEL.'))).toBe(true);
    expect(FRONT_LEFT_WHEEL_V2.map((part) => part.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('keeps valid finite source offsets in the original Z-up coordinate system', () => {
    for (const part of FRONT_LEFT_WHEEL_V2) {
      expect(part.authoredOffsetZUp).toHaveLength(3);
      expect(part.authoredOffsetZUp.every(Number.isFinite)).toBe(true);
      expect(part.authoredOffsetZUp[1]).toBeGreaterThan(0);
    }
  });

  it('does not claim unverified mechanical engagement for wheel hub connections', () => {
    const blocked = FRONT_LEFT_WHEEL_V2.filter(
      (part) => part.engineeringConfidence === 'unproven-fitment',
    );
    expect(blocked.map((part) => part.id)).toContain('FRONT_LEFT_WHEEL.WHEEL_HUB');
    expect(blocked.map((part) => part.id)).toContain('FRONT_LEFT_WHEEL.HUB_MOUNT_INTERFACE');
  });

  it('defines distinct hero, blueprint and macro review scenes', () => {
    expect(FRONT_LEFT_WHEEL_LOOKDEV.hero.background).toBe(ENGINEERING_V2_PALETTE.graphiteBackground);
    expect(FRONT_LEFT_WHEEL_LOOKDEV.blueprint.background).toBe(ENGINEERING_V2_PALETTE.blueprint);
    expect(FRONT_LEFT_WHEEL_LOOKDEV.macro.background).toBe(ENGINEERING_V2_PALETTE.graphitePanel);
  });
});
