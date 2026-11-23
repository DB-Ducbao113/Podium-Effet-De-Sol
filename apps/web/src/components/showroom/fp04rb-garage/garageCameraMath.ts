import * as THREE from "three";
import type { WheelCorner } from "./fp04rbLoader";
import {
  INSPECTION_PARTS,
  type BayFocus,
  type CameraPresetId,
  type GarageMode,
} from "./inspectionParts";

export const GARAGE_DIMENSIONS = {
  width: 16,
  depth: 12,
  height: 5,
} as const;

export const BAY_X = {
  bay1: -2.45,
  bay2: 2.45,
} as const;

export const CAR_Z_CENTER = -0.35;

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const GARAGE_BOUNDS = {
  minX: -(GARAGE_DIMENSIONS.width / 2 - 0.55), // -7.45m
  maxX: GARAGE_DIMENSIONS.width / 2 - 0.55, // +7.45m
  minY: 0.34,
  maxY: GARAGE_DIMENSIONS.height - 0.62, // 4.38m (below gantry truss)
  minZ: -(GARAGE_DIMENSIONS.depth / 2 - 0.85), // -5.15m (clear of rear workbench)
  maxZ: GARAGE_DIMENSIONS.depth / 2 - 0.25, // +5.75m (pit apron threshold)
} as const;

const CAR_HULL = {
  halfWidth: 1.14,
  minZ: CAR_Z_CENTER - 2.65,
  maxZ: CAR_Z_CENTER + 3.0,
  maxY: 1.24,
} as const;

/**
 * Clamps any camera position strictly inside the 16x12x5m garage walls/floor/ceiling
 * and pushes the camera outside both car hulls to guarantee zero wall/body clipping.
 */
export function clampCameraPositionToGarage(pos: THREE.Vector3): THREE.Vector3 {
  const out = pos.clone();
  out.x = THREE.MathUtils.clamp(out.x, GARAGE_BOUNDS.minX, GARAGE_BOUNDS.maxX);
  out.y = THREE.MathUtils.clamp(out.y, GARAGE_BOUNDS.minY, GARAGE_BOUNDS.maxY);
  out.z = THREE.MathUtils.clamp(out.z, GARAGE_BOUNDS.minZ, GARAGE_BOUNDS.maxZ);

  for (const bx of [BAY_X.bay1, BAY_X.bay2]) {
    if (
      Math.abs(out.x - bx) < CAR_HULL.halfWidth &&
      out.z > CAR_HULL.minZ &&
      out.z < CAR_HULL.maxZ &&
      out.y < CAR_HULL.maxY
    ) {
      const dx = out.x - bx;
      const distOutSide = CAR_HULL.halfWidth - Math.abs(dx);
      const distUp = CAR_HULL.maxY - out.y;
      if (distUp <= distOutSide && CAR_HULL.maxY <= GARAGE_BOUNDS.maxY) {
        out.y = CAR_HULL.maxY + 0.08;
      } else {
        out.x = bx + (dx >= 0 ? CAR_HULL.halfWidth : -CAR_HULL.halfWidth);
        out.x = THREE.MathUtils.clamp(
          out.x,
          GARAGE_BOUNDS.minX,
          GARAGE_BOUNDS.maxX,
        );
      }
    }
  }

  return out;
}

function cornerCloseupOffsets(corner: WheelCorner): {
  offset: [number, number, number];
  target: [number, number, number];
} {
  switch (corner) {
    case "FL":
      return { offset: [2.15, 1.05, 2.75], target: [0.85, 0.36, 1.65] };
    case "FR":
      return { offset: [-2.15, 1.05, 2.75], target: [-0.85, 0.36, 1.65] };
    case "RL":
      return { offset: [2.15, 1.05, -0.75], target: [0.85, 0.36, -1.75] };
    case "RR":
      return { offset: [-2.15, 1.05, -0.75], target: [-0.85, 0.36, -1.75] };
  }
}

export function resolveGarageCameraPreset(params: {
  preset: CameraPresetId;
  bayFocus: BayFocus;
  mode: GarageMode;
  selectedPartId: string;
  maintenanceCorner: WheelCorner;
}): CameraPose {
  const bx = params.bayFocus === "bay-1" ? BAY_X.bay1 : BAY_X.bay2;
  const bz = CAR_Z_CENTER;

  let rawPos: THREE.Vector3;
  let target: THREE.Vector3;

  switch (params.preset) {
    case "pit-lane-overview":
      rawPos = new THREE.Vector3(0, 2.75, 5.75);
      target = new THREE.Vector3(0, 0.55, -0.5);
      break;
    case "front":
      rawPos = new THREE.Vector3(bx, 1.05, 4.75);
      target = new THREE.Vector3(bx, 0.42, bz + 0.3);
      break;
    case "left-side":
      rawPos = new THREE.Vector3(bx + 3.45, 1.12, bz + 0.15);
      target = new THREE.Vector3(bx, 0.46, bz);
      break;
    case "right-side":
      rawPos = new THREE.Vector3(bx - 3.45, 1.12, bz + 0.15);
      target = new THREE.Vector3(bx, 0.46, bz);
      break;
    case "rear":
      rawPos = new THREE.Vector3(bx, 1.25, -4.45);
      target = new THREE.Vector3(bx, 0.52, bz - 0.3);
      break;
    case "top":
      rawPos = new THREE.Vector3(bx, 4.28, bz + 0.25);
      target = new THREE.Vector3(bx, 0.28, bz);
      break;
    case "front-34-left":
      rawPos = new THREE.Vector3(bx + 2.55, 1.18, bz + 3.45);
      target = new THREE.Vector3(bx, 0.45, bz + 0.15);
      break;
    case "front-34-right":
      rawPos = new THREE.Vector3(bx - 2.55, 1.18, bz + 3.45);
      target = new THREE.Vector3(bx, 0.45, bz + 0.15);
      break;
    case "rear-34-left":
      rawPos = new THREE.Vector3(bx + 1.85, 1.52, bz - 3.95);
      target = new THREE.Vector3(bx, 0.48, bz - 0.15);
      break;
    case "rear-34-right":
      rawPos = new THREE.Vector3(bx - 1.85, 1.52, bz - 3.95);
      target = new THREE.Vector3(bx, 0.48, bz - 0.15);
      break;
    case "technical-closeup": {
      if (params.mode === "maintenance") {
        const c = cornerCloseupOffsets(params.maintenanceCorner);
        rawPos = new THREE.Vector3(
          bx + c.offset[0],
          c.offset[1],
          bz + c.offset[2],
        );
        target = new THREE.Vector3(
          bx + c.target[0],
          c.target[1],
          bz + c.target[2],
        );
      } else {
        const part = INSPECTION_PARTS.find(
          (p) => p.id === params.selectedPartId,
        );
        if (
          part?.supported &&
          part.relativeCameraOffset &&
          part.relativeTargetOffset
        ) {
          rawPos = new THREE.Vector3(
            bx + part.relativeCameraOffset[0],
            part.relativeCameraOffset[1],
            bz + part.relativeCameraOffset[2],
          );
          target = new THREE.Vector3(
            bx + part.relativeTargetOffset[0],
            part.relativeTargetOffset[1],
            bz + part.relativeTargetOffset[2],
          );
        } else {
          rawPos = new THREE.Vector3(bx + 2.15, 0.95, bz + 2.25);
          target = new THREE.Vector3(bx, 0.48, bz);
        }
      }
      break;
    }
  }

  return {
    position: clampCameraPositionToGarage(rawPos),
    target,
  };
}

export function applyPerspectiveCameraFov(
  camera: THREE.Camera,
  width: number,
  height: number,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;
  const aspect = width / Math.max(1, height);
  camera.fov = aspect < 0.78 ? 50 : 42;
  camera.updateProjectionMatrix();
}

export function snapCameraPose(
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  pose: CameraPose,
): void {
  camera.position.copy(pose.position);
  if (controls) {
    controls.target.copy(pose.target);
    controls.update();
  } else {
    camera.lookAt(pose.target);
  }
}

export function stepCameraTowardPose(
  camera: THREE.Camera,
  controls: { target: THREE.Vector3; update: () => void } | null,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  alpha: number,
): boolean {
  camera.position.lerp(targetPos, alpha);
  if (controls) {
    controls.target.lerp(targetLookAt, alpha);
    controls.update();
  }
  const done =
    camera.position.distanceTo(targetPos) < 0.015 &&
    (!controls || controls.target.distanceTo(targetLookAt) < 0.015);
  if (done) {
    camera.position.copy(targetPos);
    if (controls) {
      controls.target.copy(targetLookAt);
      controls.update();
    }
  }
  return !done;
}

export function enforceCameraCollisionBounds(camera: THREE.Camera): void {
  const clamped = clampCameraPositionToGarage(camera.position);
  if (clamped.distanceToSquared(camera.position) > 1e-6) {
    camera.position.copy(clamped);
  }
}
