import * as THREE from "three";
import type { EngineeringVector3 } from "./engineeringStoryTimeline";

export interface EngineeringSafeViewRegion {
  /** Normalized left edge of the clear stage rectangle. */
  readonly left: number;
  /** Normalized top edge of the clear stage rectangle. */
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface EngineeringCameraFrame {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly distance: number;
}

export interface EngineeringCameraFitOptions {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly safeRegion: EngineeringSafeViewRegion;
  readonly direction: EngineeringVector3;
  readonly fov: number;
  readonly framing: number;
  readonly lookTargetBias: EngineeringVector3;
  readonly targetBounds?: THREE.Box3;
}

export type EngineeringCameraEasingProfile =
  "smoothstep" | "cinematic-dolly" | "inspect-drift" | "settle-hold";

export interface EngineeringCameraArcOptions {
  /** Radial horizontal arc offset (in world units) curving outward around target. */
  readonly lateralArc?: number;
  /** Phase-specific symmetric/cinematic interpolation curve. */
  readonly easing?: EngineeringCameraEasingProfile;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

// Reusable scratch objects for zero-allocation steady-state frame evaluation
const _scratchSphere = new THREE.Sphere();
const _scratchTargetSize = new THREE.Vector3();
const _scratchDir = new THREE.Vector3();
const _scratchForward = new THREE.Vector3();
const _scratchRight = new THREE.Vector3();
const _scratchUp = new THREE.Vector3();
const _scratchMid = new THREE.Vector3();
const _scratchControl = new THREE.Vector3();
const _scratchTargetMid = new THREE.Vector3();
const _scratchTargetControl = new THREE.Vector3();
const _scratchRadialXZ = new THREE.Vector3();
const _scratchClearanceBox = new THREE.Box3();
const _scratchClearanceCenter = new THREE.Vector3();
const _scratchClearanceSize = new THREE.Vector3();

export interface MutableEngineeringCameraFrame {
  readonly position: THREE.Vector3;
  readonly target: THREE.Vector3;
  distance: number;
}

export function createMutableCameraFrame(): MutableEngineeringCameraFrame {
  return {
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    distance: 5,
  };
}

export function shouldEnterEngineeringOrbitFromDrag(
  pointerType: string,
  deltaX: number,
  deltaY: number,
): boolean {
  const horizontal = Math.abs(finiteOr(deltaX, 0));
  const vertical = Math.abs(finiteOr(deltaY, 0));
  if (pointerType === "touch") {
    return horizontal > 6 && horizontal >= vertical * 1.15;
  }
  return horizontal * horizontal + vertical * vertical > 36;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function normalizedRegion(
  region: EngineeringSafeViewRegion,
): EngineeringSafeViewRegion {
  const left = THREE.MathUtils.clamp(finiteOr(region.left, 0.05), 0, 0.8);
  const top = THREE.MathUtils.clamp(finiteOr(region.top, 0.08), 0, 0.8);
  const width = THREE.MathUtils.clamp(
    finiteOr(region.width, 0.9),
    0.15,
    1 - left,
  );
  const height = THREE.MathUtils.clamp(
    finiteOr(region.height, 0.82),
    0.15,
    1 - top,
  );
  return { left, top, width, height };
}

/** Zero-allocation version of fitEngineeringCameraToBounds for hot useFrame loops. */
export function fitEngineeringCameraToBoundsInto(
  framingBounds: THREE.Box3,
  options: EngineeringCameraFitOptions,
  out: MutableEngineeringCameraFrame,
): boolean {
  if (framingBounds.isEmpty()) return false;
  const width = Math.max(1, finiteOr(options.viewportWidth, 1));
  const height = Math.max(1, finiteOr(options.viewportHeight, 1));
  const region = normalizedRegion(options.safeRegion);
  const fov = THREE.MathUtils.clamp(finiteOr(options.fov, 34), 12, 65);
  framingBounds.getBoundingSphere(_scratchSphere);
  if (!Number.isFinite(_scratchSphere.radius) || _scratchSphere.radius <= 0) {
    return false;
  }

  const targetBounds = options.targetBounds ?? framingBounds;
  targetBounds.getSize(_scratchTargetSize);
  framingBounds.getCenter(out.target);
  out.target.x += _scratchTargetSize.x * options.lookTargetBias[0];
  out.target.y += _scratchTargetSize.y * options.lookTargetBias[1];
  out.target.z += _scratchTargetSize.z * options.lookTargetBias[2];

  const verticalHalfFov = THREE.MathUtils.degToRad(fov / 2);
  const horizontalHalfFov = Math.atan(
    Math.tan(verticalHalfFov) * (width / height),
  );
  const safeVerticalHalfFov = Math.atan(
    Math.tan(verticalHalfFov) * region.height,
  );
  const safeHorizontalHalfFov = Math.atan(
    Math.tan(horizontalHalfFov) * region.width,
  );
  const limitingHalfFov = Math.max(
    THREE.MathUtils.degToRad(2),
    Math.min(safeVerticalHalfFov, safeHorizontalHalfFov),
  );
  const distance = Math.max(
    0.18,
    (_scratchSphere.radius / Math.sin(limitingHalfFov)) *
    THREE.MathUtils.clamp(finiteOr(options.framing, 1.2), 0.52, 4.5),
  );

  _scratchDir.set(
    options.direction[0],
    options.direction[1],
    options.direction[2],
  );
  if (_scratchDir.lengthSq() < 1e-8) _scratchDir.set(-0.7, 0.28, -0.65);
  _scratchDir.normalize();

  _scratchForward.copy(_scratchDir).negate();
  _scratchRight.crossVectors(_scratchForward, WORLD_UP);
  if (_scratchRight.lengthSq() < 1e-8) {
    _scratchRight.set(1, 0, 0);
  } else {
    _scratchRight.normalize();
  }
  _scratchUp.crossVectors(_scratchRight, _scratchForward).normalize();

  const centerX = region.left + region.width / 2;
  const centerY = region.top + region.height / 2;
  const ndcX = centerX * 2 - 1;
  const ndcY = 1 - centerY * 2;
  const halfFrameWidth = distance * Math.tan(horizontalHalfFov);
  const halfFrameHeight = distance * Math.tan(verticalHalfFov);
  out.target.addScaledVector(_scratchRight, -ndcX * halfFrameWidth);
  out.target.addScaledVector(_scratchUp, -ndcY * halfFrameHeight);

  out.position.copy(out.target).addScaledVector(_scratchDir, distance);
  out.distance = distance;
  return true;
}

export function evaluateCameraEasing(
  rawProgress: number,
  profile: EngineeringCameraEasingProfile = "smoothstep",
): number {
  const x = THREE.MathUtils.clamp(finiteOr(rawProgress, 0), 0, 1);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  switch (profile) {
    case "cinematic-dolly": {
      // C2-continuous quintic smootherstep blended with smoothstep:
      // strictly symmetric f(1 - x) = 1 - f(x), zero endpoint jerk, sweeping mid-flight velocity.
      const smooth3 = x * x * (3 - 2 * x);
      const smooth5 = x * x * x * (x * (x * 6 - 15) + 10);
      return smooth3 * 0.28 + smooth5 * 0.72;
    }
    case "inspect-drift":
      // Gentle museum-turntable sinusoidal parallax (symmetric around 0.5)
      return -(Math.cos(Math.PI * x) - 1) * 0.5;
    case "settle-hold": {
      // Decisive early alignment followed by a long, silky quintic settle into lock
      const inv = 1 - x;
      const outQuart = 1 - inv * inv * inv * inv;
      const smooth3 = x * x * (3 - 2 * x);
      return smooth3 * 0.45 + outQuart * 0.55;
    }
    default:
      return x * x * (3 - 2 * x);
  }
}

/** Zero-allocation scroll-driven 3D orbital + dolly quadratic Bezier arc into an existing frame. */
export function interpolateEngineeringCameraFramesInto(
  from: EngineeringCameraFrame,
  to: EngineeringCameraFrame,
  progress: number,
  arcHeight: number,
  out: MutableEngineeringCameraFrame,
  arcOptions?: EngineeringCameraArcOptions,
): void {
  const raw = THREE.MathUtils.clamp(finiteOr(progress, 0), 0, 1);
  if (raw === 0) {
    out.position.copy(from.position);
    out.target.copy(from.target);
    out.distance = from.distance;
    return;
  }
  if (raw === 1) {
    out.position.copy(to.position);
    out.target.copy(to.target);
    out.distance = to.distance;
    return;
  }

  const t = evaluateCameraEasing(raw, arcOptions?.easing ?? "smoothstep");
  const inverse = 1 - t;
  const lift = Math.max(0, finiteOr(arcHeight, 0));
  const lateral = Math.max(0, finiteOr(arcOptions?.lateralArc ?? 0, 0));

  _scratchMid.copy(from.position).lerp(to.position, 0.5);
  _scratchTargetMid.copy(from.target).lerp(to.target, 0.5);

  _scratchControl.copy(_scratchMid).addScaledVector(WORLD_UP, lift);
  if (lateral > 1e-5) {
    // Symmetric outward horizontal radial offset keeps orbital transits on a natural
    // curved path around the car silhouette rather than cutting linearly across chords.
    _scratchRadialXZ.set(
      _scratchMid.x - _scratchTargetMid.x,
      0,
      _scratchMid.z - _scratchTargetMid.z,
    );
    const radialLenSq = _scratchRadialXZ.lengthSq();
    if (radialLenSq > 1e-6) {
      _scratchRadialXZ.multiplyScalar(1 / Math.sqrt(radialLenSq));
      _scratchControl.addScaledVector(_scratchRadialXZ, lateral);
    }
  }

  out.position
    .copy(from.position)
    .multiplyScalar(inverse * inverse)
    .addScaledVector(_scratchControl, 2 * inverse * t)
    .addScaledVector(to.position, t * t);

  _scratchTargetControl
    .copy(_scratchTargetMid)
    .addScaledVector(WORLD_UP, lift * 0.14);
  out.target
    .copy(from.target)
    .multiplyScalar(inverse * inverse)
    .addScaledVector(_scratchTargetControl, 2 * inverse * t)
    .addScaledVector(to.target, t * t);

  out.distance = THREE.MathUtils.lerp(from.distance, to.distance, t);
}

/**
 * Blends two camera poses during Orbit/Isolation handoff while smoothly lifting
 * the chord arc whenever the linear path would pass through scene geometry.
 */
export function blendEngineeringCameraWithClearance(
  from: EngineeringCameraFrame,
  to: EngineeringCameraFrame,
  easedProgress: number,
  clearanceBounds: THREE.Box3 | null,
): EngineeringCameraFrame {
  const u = THREE.MathUtils.clamp(finiteOr(easedProgress, 0), 0, 1);
  const position = from.position.clone().lerp(to.position, u);
  const target = from.target.clone().lerp(to.target, u);

  if (clearanceBounds && !clearanceBounds.isEmpty() && u > 0 && u < 1) {
    _scratchClearanceBox.copy(clearanceBounds).expandByScalar(0.32);
    const midpoint = _scratchMid.copy(from.position).lerp(to.position, 0.5);
    if (
      _scratchClearanceBox.containsPoint(position) ||
      _scratchClearanceBox.containsPoint(midpoint)
    ) {
      _scratchClearanceBox.getCenter(_scratchClearanceCenter);
      _scratchClearanceBox.getSize(_scratchClearanceSize);
      const safeTopY = _scratchClearanceBox.max.y + 0.45;
      const chordLift = Math.max(0.85, safeTopY - midpoint.y);
      const bell = 4 * u * (1 - u);
      position.y += chordLift * bell;
      // Also nudge radially away from center if still inside box
      if (_scratchClearanceBox.containsPoint(position)) {
        position.y = safeTopY;
      }
    }
  }

  return {
    position,
    target,
    distance: position.distanceTo(target),
  };
}

/** Fits measured GLB bounds inside the real clear stage area, including overlay space. */
export function fitEngineeringCameraToBounds(
  framingBounds: THREE.Box3,
  options: EngineeringCameraFitOptions,
): EngineeringCameraFrame | null {
  const out = createMutableCameraFrame();
  return fitEngineeringCameraToBoundsInto(framingBounds, options, out)
    ? out
    : null;
}

/** Scroll-driven 3D orbital + dolly Bezier arc; endpoints remain exact and reversible. */
export function interpolateEngineeringCameraFrames(
  from: EngineeringCameraFrame,
  to: EngineeringCameraFrame,
  progress: number,
  arcHeight: number,
  arcOptions?: EngineeringCameraArcOptions,
): EngineeringCameraFrame {
  const out = createMutableCameraFrame();
  interpolateEngineeringCameraFramesInto(
    from,
    to,
    progress,
    arcHeight,
    out,
    arcOptions,
  );
  return out;
}
