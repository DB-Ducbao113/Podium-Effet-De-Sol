import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { FRONT_LEFT_WHEEL_SHOTS } from '../design/frontLeftWheelShots';

export type Vector3Tuple = readonly [number, number, number];

export interface PilotFrame {
  /** Normalized single source of truth; reverse seeking is deterministic. */
  progress: number;
  detachment: number;
  blueprint: number;
  /** Normalized camera position, in scene-space Y-up coordinates. */
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
  highlight: string | null;
}

export function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function smoothProgress(value: number): number {
  const t = clampProgress(value);
  return t * t * (3 - 2 * t);
}

export function sourceOffsetToYUp([x, y, z]: Vector3Tuple): Vector3Tuple {
  return [x, z, -y];
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix3(a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function cameraPositionAt(index: number): Vector3Tuple {
  const { camera } = FRONT_LEFT_WHEEL_SHOTS[index];
  const [dx, dy, dz] = camera.direction;
  const length = Math.hypot(dx, dy, dz) || 1;
  return [
    camera.target[0] + (dx / length) * camera.distance,
    camera.target[1] + (dy / length) * camera.distance,
    camera.target[2] + (dz / length) * camera.distance,
  ];
}

/**
 * All six cameras use source-anchored World Y-up positions. Interpolation
 * crosses all shot boundaries without hard jumps or drift.
 */
export function cameraFrameAt(progress: number): {
  position: Vector3Tuple;
  target: Vector3Tuple;
} {
  const p = clampProgress(progress);
  const anchors = [0, 0.18, 0.37, 0.60, 0.77, 1] as const;
  let i = 0;
  while (i < anchors.length - 2 && p > anchors[i + 1]) i++;
  const t = smoothProgress((p - anchors[i]) / (anchors[i + 1] - anchors[i]));
  return {
    position: mix3(cameraPositionAt(i), cameraPositionAt(i + 1), t),
    target: mix3(FRONT_LEFT_WHEEL_SHOTS[i].camera.target, FRONT_LEFT_WHEEL_SHOTS[i + 1].camera.target, t),
  };
}

/** 0% and 100% are assembled, with a deliberately held middle explosion. */
export function detachmentAt(progress: number): number {
  const p = clampProgress(progress);
  if (p < 0.25) return 0;
  if (p < 0.54) return smoothProgress((p - 0.25) / 0.29);
  if (p <= 0.86) return 1;
  return 1 - smoothProgress((p - 0.86) / 0.14);
}

export function blueprintAt(progress: number): number {
  const p = clampProgress(progress);
  if (p < 0.54) return 0;
  if (p < 0.69) return smoothProgress((p - 0.54) / 0.15);
  if (p <= 0.86) return 1;
  return 1 - smoothProgress((p - 0.86) / 0.14);
}

export function partDetachmentAt(progress: number, order: number): number {
  const t = detachmentAt(progress);
  const count = FRONT_LEFT_WHEEL_V2.length;
  const start = (Math.min(Math.max(order, 0), count - 1) / count) * 0.53;
  return smoothProgress((t - start) / (1 - start));
}

/** Always use the original object-local transform; do not accumulate deltas. */
export function positionFromBaseline(
  original: Vector3Tuple,
  authoredZUp: Vector3Tuple,
  progress: number,
  order: number,
): Vector3Tuple {
  const [x, y, z] = sourceOffsetToYUp(authoredZUp);
  const phase = partDetachmentAt(progress, order);
  return [
    original[0] + x * phase,
    original[1] + y * phase,
    original[2] + z * phase,
  ];
}

export function pilotFrameAt(progress: number): PilotFrame {
  const p = clampProgress(progress);
  const camera = cameraFrameAt(p);
  const shot = FRONT_LEFT_WHEEL_SHOTS.find(({ timeRange }) => p >= timeRange[0] && p < timeRange[1]);
  return {
    progress: p,
    detachment: detachmentAt(p),
    blueprint: blueprintAt(p),
    cameraPosition: camera.position,
    cameraTarget: camera.target,
    highlight: shot?.focusPart ?? null,
  };
}
