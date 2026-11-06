/**
 * P2.6 CAD-grounded steering linkage demonstration. All dimensions below are
 * authored source P2.4 hardpoints in millimetres (axle +Z). This is a ONE-DOF
 * idealized mechanism, NOT verified F1 steering/suspension kinematics.
 *
 * Source constraints:
 * - upper/lower outer joint centers lie on the +Y kingpin axis;
 * - rigid upright rotates about that axis;
 * - the single straight tie rod keeps its source length;
 * - rack endpoint can slide only in global Z to close the distance.
 * No bump/rebound, contact force, bearing dynamics or travel validated.
 */
export type P2Point = readonly [number, number, number];
export const P2_KINGPIN: P2Point = [-98, 0, -170];
export const P2_TIE_OUTER: P2Point = [114, 0, -170];
export const P2_RACK_REST: P2Point = [-260, -49, -290];
export const P2_STEER_LIMIT_DEGREES = 8;

const dist = (a: P2Point, b: P2Point): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const P2_TIE_LENGTH_MM = dist(P2_TIE_OUTER, P2_RACK_REST);

export type P2SteeringMatePose = {
  angleDegrees: number;
  outerMm: P2Point;
  rackMm: P2Point;
  rackTravelZMm: number;
  tieLengthErrorMm: number;
};

export function p2SteeringMate(angleDegrees: number): P2SteeringMatePose {
  if (!Number.isFinite(angleDegrees) ||
      Math.abs(angleDegrees) > P2_STEER_LIMIT_DEGREES) {
    throw new RangeError('P2 steering source study limited to -8..+8 degrees');
  }
  const angle = angleDegrees * Math.PI / 180;
  const arm = P2_TIE_OUTER[0] - P2_KINGPIN[0];
  const outer: P2Point = [
    P2_KINGPIN[0] + arm * Math.cos(angle),
    0,
    P2_KINGPIN[2] - arm * Math.sin(angle),
  ];
  const horizontal = outer[0] - P2_RACK_REST[0];
  const vertical = outer[1] - P2_RACK_REST[1];
  const square = P2_TIE_LENGTH_MM ** 2 - horizontal ** 2 - vertical ** 2;
  if (square < 0) throw new Error('P2 steering rod cannot close on its nominal rack axis');
  // The negative branch connects continuously to the authored rest pose.
  const rackZ = outer[2] - Math.sqrt(square);
  const rack: P2Point = [P2_RACK_REST[0], P2_RACK_REST[1], rackZ];
  return {
    angleDegrees,
    outerMm: outer,
    rackMm: rack,
    rackTravelZMm: rackZ - P2_RACK_REST[2],
    tieLengthErrorMm: dist(outer, rack) - P2_TIE_LENGTH_MM,
  };
}

export function p2SteeringRigidGroup(partId: string): 'FIXED_LINK' | 'TIE_ROD' | 'UPRIGHT_CORNER' {
  if (partId === 'P2_UPPER_WISHBONE_LINK' || partId === 'P2_LOWER_WISHBONE_LINK') {
    return 'FIXED_LINK';
  }
  if (partId === 'P2_TIE_ROD') return 'TIE_ROD';
  return 'UPRIGHT_CORNER';
}
