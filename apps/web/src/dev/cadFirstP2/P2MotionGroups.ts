/**
 * P2.5 source-specific rigid-motion assumptions for the owner-authored
 * P2.4 original front-left CAD master (+Z axle, geometry in metres).
 *
 * This is an educational VIEWER motion. It does not represent an F1
 * steering linkage, bearing dynamics, or validated physical tolerances.
 */
export type P2MotionGroup = 'WHEEL_ROTATION' | 'BEARING_ORBIT' | 'STATIC';

const WHEEL_PARTS = new Set([
  'P2_BEARING_INNER_RACE',
  'P2_TYRE_SLICK_BODY',
  'P2_RIM_FORGED_BARREL',
  'P2_WHEEL_HUB_SHAFT_FLANGE',
  'P2_CENTER_STUD_EXTERNAL_HELIX',
  'P2_CENTER_LOCK_NUT_BORE',
  'P2_CENTER_LOCK_FACE_RING',
  'P2_BRAKE_ROTOR_DRILLED_CARBON',
  'P2_BRAKE_ROTOR_HAT',
]);

export function p2MotionGroup(name: string): P2MotionGroup {
  if (name.startsWith('P2_BEARING_BALL_') || name === 'P2_BEARING_RETAINER_12_POCKET') {
    return 'BEARING_ORBIT';
  }
  if (WHEEL_PARTS.has(name) || name.startsWith('P2_ROTOR_MOUNT_')) {
    return 'WHEEL_ROTATION';
  }
  return 'STATIC';
}

/** Approximate orbit factor, not a contact-mechanics model. */
export function p2MotionFactor(name: string): number {
  const group = p2MotionGroup(name);
  return group === 'WHEEL_ROTATION' ? 1 : group === 'BEARING_ORBIT' ? 0.5 : 0;
}
