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
  maxZ: GARAGE_DIMENSIONS.depth / 2 + 1.75, // +7.75m (open pit-lane apron vista)
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
export function clampCameraPositionToGarage(
  pos: THREE.Vector3,
  allowCockpitInterior = false,
): THREE.Vector3 {
  const out = pos.clone();
  out.x = THREE.MathUtils.clamp(out.x, GARAGE_BOUNDS.minX, GARAGE_BOUNDS.maxX);
  out.y = THREE.MathUtils.clamp(out.y, GARAGE_BOUNDS.minY, GARAGE_BOUNDS.maxY);
  out.z = THREE.MathUtils.clamp(out.z, GARAGE_BOUNDS.minZ, GARAGE_BOUNDS.maxZ);

  for (const bx of [BAY_X.bay1, BAY_X.bay2]) {
    if (
      allowCockpitInterior &&
      Math.abs(out.x - bx) <= 0.42 &&
      out.y >= 0.7 &&
      out.z >= CAR_Z_CENTER + 0.04 &&
      out.z <= CAR_Z_CENTER + 0.68
    ) {
      continue;
    }
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

/**
 * Broadcast pit-box 3/4 closeup framing for every (bayFocus, corner) wheel service station.
 * Carefully placed clear of spare tyre racks (x = +/-6.8m) and the adjacent bay's F1 hull
 * (center pit aisle x in [-1.31, +1.31]), aiming slightly below axle center so the detached
 * wheel, glowing brake caliper, and wheel gunner sit cleanly ABOVE the bottom Service HUD.
 */
function cornerCloseupOffsets(
  corner: WheelCorner,
  bayFocus: BayFocus,
): {
  offset: [number, number, number];
  target: [number, number, number];
} {
  const isLeft = corner.endsWith("L");
  const isFront = corner.startsWith("F");
  const sideSign = isLeft ? 1 : -1;
  // Center-aisle flanks are Bay 1 FL/RL and Bay 2 FR/RR; outer flanks face the side walls.
  const isCenterAisle =
    (bayFocus === "bay-1" && isLeft) || (bayFocus === "bay-2" && !isLeft);

  if (isFront) {
    return {
      offset: [sideSign * (isCenterAisle ? 2.15 : 2.28), 1.14, isCenterAisle ? 3.8 : 3.72],
      target: [sideSign * 1.14, 0.24, 1.66],
    };
  }

  // Rear corners: frame from forward-outer 3/4 (+Z of the rear axle, well clear of the
  // central telemetry island at z <= -2.22m and rear workbenches at z = -5.4m) looking
  // cleanly back across the detached rear tyre, brake hub, and wheel gunner.
  return {
    offset: [sideSign * (isCenterAisle ? 2.15 : 2.38), 1.38, 0.6],
    target: [sideSign * 1.18, 0.24, -1.75],
  };
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
      rawPos = new THREE.Vector3(0, 3.15, 7.45);
      target = new THREE.Vector3(0, 0.72, -1.05);
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
        const c = cornerCloseupOffsets(
          params.maintenanceCorner,
          params.bayFocus,
        );
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

  const allowCockpitInterior =
    params.preset === "technical-closeup" &&
    params.mode === "inspection" &&
    params.selectedPartId === "cockpit";

  return {
    position: clampCameraPositionToGarage(rawPos, allowCockpitInterior),
    target,
  };
}

export function applyPerspectiveCameraFov(
  camera: THREE.Camera,
  width: number,
  height: number,
  preset: CameraPresetId = "pit-lane-overview",
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) return;
  const aspect = width / Math.max(1, height);
  const isOverview = preset === "pit-lane-overview";
  camera.fov = isOverview ? (aspect < 0.78 ? 58 : 52) : aspect < 0.78 ? 50 : 42;
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

export function enforceCameraCollisionBounds(
  camera: THREE.Camera,
  allowCockpitInterior = false,
): void {
  const clamped = clampCameraPositionToGarage(
    camera.position,
    allowCockpitInterior,
  );
  if (clamped.distanceToSquared(camera.position) > 1e-6) {
    camera.position.copy(clamped);
  }
}
