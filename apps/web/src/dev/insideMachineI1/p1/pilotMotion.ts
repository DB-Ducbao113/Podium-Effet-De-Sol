import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { FRONT_LEFT_WHEEL_SHOTS } from '../design/frontLeftWheelShots';
import { continuousFilmPoint } from './P1FilmDirector';

export type Vector3Tuple = readonly [number, number, number];
export type WheelInspectionScope = 'lock-wheel' | 'full';

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
 * Nonuniform Hermite (C1) interpolation across source-grounded camera poses.
 * Every anchor remains exact, but the camera no longer brakes to a dead stop
 * at each chapter boundary; this matters for the uninterrupted film.
 * Direct seeking still produces the same exact 3D shot, in either direction.
 */
const FILM_CAMERA_ANCHORS = [0, 0.18, 0.37, 0.60, 0.77, 1] as const;
const FILM_POSITIONS: readonly Vector3Tuple[] =
  FRONT_LEFT_WHEEL_SHOTS.map((_, index) => cameraPositionAt(index));
const FILM_TARGETS: readonly Vector3Tuple[] =
  FRONT_LEFT_WHEEL_SHOTS.map(({ camera }) => camera.target);

export function cameraFrameAt(progress: number): {
  position: Vector3Tuple;
  target: Vector3Tuple;
} {
  return {
    position: continuousFilmPoint(FILM_POSITIONS, FILM_CAMERA_ANCHORS, progress),
    target: continuousFilmPoint(FILM_TARGETS, FILM_CAMERA_ANCHORS, progress),
  };
}

/**
 * Physically ordered stage ranges (normalized story timeline).
 *
 * The center lock finishes its release and axial extraction BEFORE
 * the outer wheel begins moving. On reassembly the outer wheel seats
 * before the center lock, which is tightened last.
 *
 * These are educational cinematic staging cues, not service instructions.
 */
export const P1_PART_MOTION_PHASES = [
  { out: [0.318, 0.400], back: [0.955, 0.978] }, // center lock
  { out: [0.412, 0.495], back: [0.920, 0.952] }, // wheel outer
  { out: [0.455, 0.525], back: [0.910, 0.940] }, // wheel hub
  { out: [0.468, 0.538], back: [0.895, 0.926] }, // brake disc
  { out: [0.477, 0.540], back: [0.884, 0.915] }, // brake caliper
  { out: [0.490, 0.540], back: [0.872, 0.900] }, // suspension links
  { out: [0.500, 0.540], back: [0.860, 0.885] }, // hub interface
] as const;

/**
 * The source R4.5 nut has only 0.34 m outward displacement while the
 * outer wheel has 0.66 m. At full separation the tire hides the nut.
 * P1.2 increases only the LOOKDEV displacement to 0.84 m (+Y Blender,
 * i.e. -Z glTF), leaving the authored manifest and GLB untouched.
 */
export const CENTER_LOCK_PRESENTATION_OFFSET_Z_UP = [0, 0.84, 0] as const;

export function presentationOffsetFor(
  authoredOffset: Vector3Tuple,
  order: number,
): Vector3Tuple {
  return order === 0 ? CENTER_LOCK_PRESENTATION_OFFSET_Z_UP : authoredOffset;
}

/** Two complete turns: release while seated, retighten only after reassembly. */
export function centerLockTurnAt(progress: number): number {
  const p = clampProgress(progress);
  if (p < 0.255) return 0;
  if (p < 0.312) return smoothProgress((p - 0.255) / (0.312 - 0.255));
  if (p < 0.978) return 1;
  return 1 - smoothProgress((p - 0.978) / (1 - 0.978));
}

export function partDetachmentAt(progress: number, order: number): number {
  const p = clampProgress(progress);
  const phase = P1_PART_MOTION_PHASES[Math.min(Math.max(0, Math.trunc(order)), P1_PART_MOTION_PHASES.length - 1)];
  const [outStart, outEnd] = phase.out;
  const [backStart, backEnd] = phase.back;
  if (p < outStart) return 0;
  if (p < outEnd) return smoothProgress((p - outStart) / (outEnd - outStart));
  if (p < backStart) return 1;
  if (p < backEnd) return 1 - smoothProgress((p - backStart) / (backEnd - backStart));
  return 0;
}

/** Measured 0→1→0 exposure across the active visible components. */
export function detachmentForScope(
  progress: number,
  scope: WheelInspectionScope,
): number {
  const count = scope === 'lock-wheel' ? 2 : P1_PART_MOTION_PHASES.length;
  let total = 0;
  for (let index = 0; index < count; index++) total += partDetachmentAt(progress, index);
  return total / count;
}
export function detachmentAt(progress: number): number {
  return detachmentForScope(progress, 'full');
}

export function blueprintAt(progress: number): number {
  const p = clampProgress(progress);
  if (p < 0.54) return 0;
  if (p < 0.69) return smoothProgress((p - 0.54) / 0.15);
  if (p <= 0.86) return 1;
  return 1 - smoothProgress((p - 0.86) / 0.14);
}

/** Always use the original object-local transform; do not accumulate deltas. */
export function positionFromBaseline(
  original: Vector3Tuple,
  authoredZUp: Vector3Tuple,
  progress: number,
  order: number,
  scope: WheelInspectionScope = 'full',
): Vector3Tuple {
  const [x, y, z] = sourceOffsetToYUp(presentationOffsetFor(authoredZUp, order));
  const phase = scope === 'lock-wheel' && order > 1 ? 0 : partDetachmentAt(progress, order);
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
