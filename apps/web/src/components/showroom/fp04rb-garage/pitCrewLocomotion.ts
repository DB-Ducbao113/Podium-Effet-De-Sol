import * as THREE from "three";
import type { WheelCorner } from "./fp04rbLoader";
import type { BayFocus } from "./inspectionParts";
import type { MaintenanceState } from "./ServiceSequence";
import { BAY_X, CAR_Z_CENTER } from "./garageCameraMath";

export type PitCrewPoseMode =
  "idle" | "walk" | "crouch_gun" | "jack_operate" | "telemetry_console";

export interface CrewWaypoint2D {
  readonly x: number;
  readonly z: number;
}

export interface CrewTargetAssignment {
  readonly position: CrewWaypoint2D;
  readonly facingYaw: number;
  readonly arrivePose: PitCrewPoseMode;
  /** Optional jack lever pump progress [0..1] when arrivePose === 'jack_operate' */
  readonly workIntensity: number;
  /** Preferred walking speed (m/s) when moving to this target */
  readonly walkSpeedMps: number;
}

export interface PitCrewLocomotionState {
  x: number;
  z: number;
  yaw: number;
  speedMps: number;
  stridePhase: number;
  idlePhase: number;
  waypoints: CrewWaypoint2D[];
  waypointIndex: number;
  lastTargetX: number;
  lastTargetZ: number;
  poseWeights: Record<PitCrewPoseMode, number>;
}

interface ObstacleRect {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

const BAY1_OBSTACLE: ObstacleRect = {
  minX: BAY_X.bay1 - 1.38,
  maxX: BAY_X.bay1 + 1.38,
  minZ: CAR_Z_CENTER - 2.68,
  maxZ: CAR_Z_CENTER + 2.98,
};

const BAY2_OBSTACLE: ObstacleRect = {
  minX: BAY_X.bay2 - 1.38,
  maxX: BAY_X.bay2 + 1.38,
  minZ: CAR_Z_CENTER - 2.68,
  maxZ: CAR_Z_CENTER + 2.98,
};

const CAR_OBSTACLES: readonly ObstacleRect[] = [BAY1_OBSTACLE, BAY2_OBSTACLE];

const CORRIDOR_BAY1_LEFT_X = BAY_X.bay1 + 1.88;
const CORRIDOR_BAY1_RIGHT_X = BAY_X.bay1 - 1.88;
const CORRIDOR_BAY2_LEFT_X = BAY_X.bay2 + 1.88;
const CORRIDOR_BAY2_RIGHT_X = BAY_X.bay2 - 1.88;
const CORRIDOR_REAR_Z = CAR_Z_CENTER - 2.95;
const CORRIDOR_FRONT_Z = CAR_Z_CENTER + 3.25;

// Exact GLB wheel nut & outer tyre dimensions measured from fp04rb-showroom-desktop/mobile.glb
const FRONT_WHEEL_Z_LOCAL = 1.799;
const REAR_WHEEL_Z_LOCAL = -1.8;
const FRONT_TYRE_OUTER_X = 1.016;
const REAR_TYRE_OUTER_X = 1.054;
const FRONT_EXTRACT_M = 0.42;
const REAR_EXTRACT_M = 0.52;
// Right hand holding the wheel gun sits 0.17m to character-right (-X local),
// so offset body center along Z by +sideSign * 0.17 to align the gun nozzle dead-on the wheel nut.
const GUN_HAND_LATERAL_OFFSET_M = 0.17;

export function normalizeAngleDelta(delta: number): number {
  let a = delta;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function segmentIntersectsRect(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  rect: ObstacleRect,
): boolean {
  // Liang-Barsky slab check for 2D XZ obstacle avoidance around the Bay 1 F1 car
  const dx = bx - ax;
  const dz = bz - az;
  let t0 = 0;
  let t1 = 1;
  const checks: ReadonlyArray<readonly [number, number]> = [
    [-dx, ax - rect.minX],
    [dx, rect.maxX - ax],
    [-dz, az - rect.minZ],
    [dz, rect.maxZ - az],
  ];
  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-8) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) {
        if (r > t1) return false;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return false;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0 <= t1;
}

function pathLength(pts: readonly CrewWaypoint2D[]): number {
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  }
  return total;
}

function segmentIntersectsAnyCar(
  ax: number,
  az: number,
  bx: number,
  bz: number,
): boolean {
  return CAR_OBSTACLES.some((rect) =>
    segmentIntersectsRect(ax, az, bx, bz, rect),
  );
}

function nearestCorridorX(x: number): number {
  const candidates = [
    CORRIDOR_BAY1_RIGHT_X,
    CORRIDOR_BAY1_LEFT_X,
    0,
    CORRIDOR_BAY2_RIGHT_X,
    CORRIDOR_BAY2_LEFT_X,
  ];
  let best = candidates[0];
  let bestDist = Math.abs(x - best);
  for (const c of candidates) {
    const d = Math.abs(x - c);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Computes a collision-free waypoint path around both Bay 1 and Bay 2 F1 car hulls so pit crew
 * members walk realistically around the nose, rear wing, or center pit aisle rather than clipping through either chassis.
 */
export function buildCrewBayPath(
  from: CrewWaypoint2D,
  to: CrewWaypoint2D,
): CrewWaypoint2D[] {
  const directDist = Math.hypot(to.x - from.x, to.z - from.z);
  if (directDist < 0.04) return [{ x: to.x, z: to.z }];

  if (!segmentIntersectsAnyCar(from.x, from.z, to.x, to.z)) {
    return [{ x: to.x, z: to.z }];
  }

  const startCorridorX = nearestCorridorX(from.x);
  const endCorridorX = nearestCorridorX(to.x);

  // Same vertical corridor lane (e.g. same flank of Bay 1 or Bay 2): step cleanly along corridor
  if (Math.abs(startCorridorX - endCorridorX) < 0.05) {
    const sameSideRoute: CrewWaypoint2D[] = [
      { x: startCorridorX, z: from.z },
      { x: startCorridorX, z: to.z },
      { x: to.x, z: to.z },
    ];
    return sameSideRoute.filter(
      (pt, idx) =>
        idx === sameSideRoute.length - 1 ||
        Math.hypot(
          pt.x - (idx === 0 ? from.x : sameSideRoute[idx - 1].x),
          pt.z - (idx === 0 ? from.z : sameSideRoute[idx - 1].z),
        ) > 0.08,
    );
  }

  // Crossing a car hull or moving between bays: compare walking around the rear wing vs. around the front wing
  const rearRoute: CrewWaypoint2D[] = [
    { x: from.x, z: from.z },
    { x: startCorridorX, z: CORRIDOR_REAR_Z },
    { x: endCorridorX, z: CORRIDOR_REAR_Z },
    { x: to.x, z: to.z },
  ];
  const frontRoute: CrewWaypoint2D[] = [
    { x: from.x, z: from.z },
    { x: startCorridorX, z: CORRIDOR_FRONT_Z },
    { x: endCorridorX, z: CORRIDOR_FRONT_Z },
    { x: to.x, z: to.z },
  ];

  const chosen =
    pathLength(rearRoute) <= pathLength(frontRoute) ? rearRoute : frontRoute;
  // Drop start point (current position) and deduplicate nearly coincident waypoints
  const filtered: CrewWaypoint2D[] = [];
  for (let i = 1; i < chosen.length; i += 1) {
    const prev = i === 1 ? from : filtered[filtered.length - 1];
    if (Math.hypot(chosen[i].x - prev.x, chosen[i].z - prev.z) > 0.08) {
      filtered.push(chosen[i]);
    }
  }
  return filtered.length > 0 ? filtered : [{ x: to.x, z: to.z }];
}

export function getWheelGunnerTarget(
  maintenanceState: MaintenanceState,
  bayFocus: BayFocus = "bay-1",
): CrewTargetAssignment {
  const bx = bayFocus === "bay-1" ? BAY_X.bay1 : BAY_X.bay2;
  const corner: WheelCorner = maintenanceState.corner;
  const isLeft = corner.endsWith("L");
  const isFront = corner.startsWith("F");

  // Exact GLB wheel nut world coordinates (Bay 1 or Bay 2)
  const wheelZ =
    CAR_Z_CENTER + (isFront ? FRONT_WHEEL_Z_LOCAL : REAR_WHEEL_Z_LOCAL);
  const tyreOuterX = isFront ? FRONT_TYRE_OUTER_X : REAR_TYRE_OUTER_X;
  const maxExtract = isFront ? FRONT_EXTRACT_M : REAR_EXTRACT_M;
  const sideSign = isLeft ? 1 : -1;

  // Position gunner so boots clear the mounted tyre and the right-hand wheel gun nozzle aligns dead-center on the nut
  const workX = bx + sideSign * (tyreOuterX + 0.62);
  const workZ = wheelZ + sideSign * GUN_HAND_LATERAL_OFFSET_M;
  // Face inward toward the center-lock wheel nut
  const faceWheelYaw = isLeft ? -Math.PI * 0.5 : Math.PI * 0.5;

  // Safe extraction clearance station completely outside the detached tyre & wheel-nut swept corridor
  const clearX = bx + sideSign * (tyreOuterX + maxExtract + 0.72);
  const clearZ = wheelZ + (isFront ? -0.92 : 0.92);
  const clearYaw = Math.atan2(
    bx + sideSign * tyreOuterX - clearX,
    wheelZ - clearZ,
  );

  // Standby position clear of the center pit-lane overview aisle & adjacent car while staying ~3m from active wheel
  const standbySideX = isLeft
    ? bayFocus === "bay-1"
      ? bx + 1.82
      : bx + 2.05
    : bayFocus === "bay-1"
      ? bx - 2.15
      : bx - 1.82;
  const standbyPos: CrewWaypoint2D = {
    x: standbySideX,
    z: isFront ? CAR_Z_CENTER - 1.15 : CAR_Z_CENTER - 3.05,
  };
  const standbyYaw = isLeft ? -Math.PI * 0.28 : Math.PI * 0.28;

  switch (maintenanceState.step) {
    case "IDLE":
      return {
        position: standbyPos,
        facingYaw: standbyYaw,
        arrivePose: "idle",
        workIntensity: 0,
        walkSpeedMps: 2.9,
      };
    case "APPROACH_JACKS":
      return {
        position: { x: workX, z: workZ },
        facingYaw: faceWheelYaw,
        arrivePose: "crouch_gun",
        workIntensity: 0.25,
        walkSpeedMps: 4.1,
      };
    case "LIFT_CAR":
      return {
        position: { x: workX, z: workZ },
        facingYaw: faceWheelYaw,
        arrivePose: "crouch_gun",
        workIntensity: 0.5,
        walkSpeedMps: 3.2,
      };
    case "LOOSEN_WHEEL_NUT":
      // Once the center-lock nut is spun loose (progress >= 0.42), immediately step clear BEFORE
      // the wheel slides outward at progress >= 0.72 so the detached tyre never collides with the mechanic.
      if (
        maintenanceState.wheelRemovalCapable &&
        maintenanceState.stepProgress >= 0.42
      ) {
        return {
          position: { x: clearX, z: clearZ },
          facingYaw: clearYaw,
          arrivePose: "idle",
          workIntensity: 0.15,
          walkSpeedMps: 3.8,
        };
      }
      return {
        position: { x: workX, z: workZ },
        facingYaw: faceWheelYaw,
        arrivePose: "crouch_gun",
        workIntensity: 1.0,
        walkSpeedMps: 2.8,
      };
    case "INSPECTION_DETACHED":
      return {
        position: { x: clearX, z: clearZ },
        facingYaw: clearYaw,
        arrivePose: "idle",
        workIntensity: 0.15,
        walkSpeedMps: 3.4,
      };
    case "INSPECTION_MOUNTED":
      return {
        position: { x: workX + sideSign * 0.34, z: workZ },
        facingYaw: faceWheelYaw,
        arrivePose: "crouch_gun",
        workIntensity: 0.35,
        walkSpeedMps: 2.2,
      };
    case "REMOUNT_TORQUE":
      // Stay safely clear while the wheel slides back onto the hub (progress < 0.35),
      // then step smoothly back in to crouch and torque the center-lock nut tight.
      if (
        maintenanceState.wheelRemovalCapable &&
        maintenanceState.stepProgress < 0.35
      ) {
        return {
          position: { x: clearX, z: clearZ },
          facingYaw: clearYaw,
          arrivePose: "idle",
          workIntensity: 0.2,
          walkSpeedMps: 3.2,
        };
      }
      return {
        position: { x: workX, z: workZ },
        facingYaw: faceWheelYaw,
        arrivePose: "crouch_gun",
        workIntensity: 1.0,
        walkSpeedMps: 3.6,
      };
    case "LOWER_CAR":
      return {
        position: standbyPos,
        facingYaw: standbyYaw,
        arrivePose: "idle",
        workIntensity: 0,
        walkSpeedMps: 3.1,
      };
  }
}

export function getFrontJackOperatorTarget(
  frontJackX: number,
  frontJackZ: number,
  maintenanceState: MaintenanceState,
): CrewTargetAssignment {
  const activeLift =
    maintenanceState.step === "LIFT_CAR" ||
    maintenanceState.step === "LOOSEN_WHEEL_NUT" ||
    maintenanceState.step === "INSPECTION_DETACHED" ||
    maintenanceState.step === "INSPECTION_MOUNTED" ||
    maintenanceState.step === "REMOUNT_TORQUE";

  const engaged =
    maintenanceState.step !== "IDLE" && maintenanceState.step !== "LOWER_CAR";

  return {
    position: {
      x: frontJackX - (engaged ? 0.04 : 0.26),
      z: frontJackZ + 0.62,
    },
    facingYaw: Math.PI,
    arrivePose:
      activeLift || maintenanceState.step === "APPROACH_JACKS"
        ? "jack_operate"
        : "idle",
    workIntensity:
      maintenanceState.step === "LIFT_CAR"
        ? 1.0
        : activeLift
          ? 0.55
          : maintenanceState.step === "APPROACH_JACKS"
            ? 0.35
            : 0,
    walkSpeedMps: 2.4,
  };
}

export function getRearJackOperatorTarget(
  rearJackX: number,
  rearJackZ: number,
  maintenanceState: MaintenanceState,
): CrewTargetAssignment {
  const activeLift =
    maintenanceState.step === "LIFT_CAR" ||
    maintenanceState.step === "LOOSEN_WHEEL_NUT" ||
    maintenanceState.step === "INSPECTION_DETACHED" ||
    maintenanceState.step === "INSPECTION_MOUNTED" ||
    maintenanceState.step === "REMOUNT_TORQUE";

  const engaged =
    maintenanceState.step !== "IDLE" && maintenanceState.step !== "LOWER_CAR";

  return {
    position: {
      x: rearJackX - (engaged ? 0.04 : 0.22),
      z: rearJackZ - 0.62,
    },
    facingYaw: 0,
    arrivePose:
      activeLift || maintenanceState.step === "APPROACH_JACKS"
        ? "jack_operate"
        : "idle",
    workIntensity:
      maintenanceState.step === "LIFT_CAR"
        ? 1.0
        : activeLift
          ? 0.55
          : maintenanceState.step === "APPROACH_JACKS"
            ? 0.35
            : 0,
    walkSpeedMps: 2.4,
  };
}

export function createInitialLocomotionState(
  x: number,
  z: number,
  yaw: number,
  initialPose: PitCrewPoseMode = "idle",
): PitCrewLocomotionState {
  return {
    x,
    z,
    yaw,
    speedMps: 0,
    stridePhase: 0,
    idlePhase: 0,
    waypoints: [],
    waypointIndex: 0,
    lastTargetX: x,
    lastTargetZ: z,
    poseWeights: {
      idle: initialPose === "idle" ? 1 : 0,
      walk: initialPose === "walk" ? 1 : 0,
      crouch_gun: initialPose === "crouch_gun" ? 1 : 0,
      jack_operate: initialPose === "jack_operate" ? 1 : 0,
      telemetry_console: initialPose === "telemetry_console" ? 1 : 0,
    },
  };
}

/**
 * Advances pit crew floor locomotion, curved waypoint progression, smooth heading turn,
 * velocity-coupled bipedal stride phase, and cross-faded skeletal pose weights.
 * Guarantees zero teleportation and bounded per-frame displacement.
 */
export function stepCrewLocomotion(
  state: PitCrewLocomotionState,
  target: CrewTargetAssignment,
  deltaSec: number,
  useBayAvoidance: boolean,
  reducedMotion = false,
): void {
  const dt = Math.max(0, Math.min(deltaSec, 0.05));
  state.idlePhase += dt;

  // Rebuild waypoint path only when target meaningfully moves
  const targetMoved = Math.hypot(
    target.position.x - state.lastTargetX,
    target.position.z - state.lastTargetZ,
  );
  if (targetMoved > 0.05) {
    state.lastTargetX = target.position.x;
    state.lastTargetZ = target.position.z;
    state.waypoints = useBayAvoidance
      ? buildCrewBayPath({ x: state.x, z: state.z }, target.position)
      : [{ x: target.position.x, z: target.position.z }];
    state.waypointIndex = 0;
  }

  if (reducedMotion) {
    state.x = target.position.x;
    state.z = target.position.z;
    state.yaw = target.facingYaw;
    state.speedMps = 0;
    state.waypoints = [];
    state.waypointIndex = 0;
    for (const k of Object.keys(state.poseWeights) as PitCrewPoseMode[]) {
      state.poseWeights[k] = k === target.arrivePose ? 1 : 0;
    }
    return;
  }

  let moving = false;
  if (state.waypointIndex < state.waypoints.length) {
    const wp = state.waypoints[state.waypointIndex];
    const dx = wp.x - state.x;
    const dz = wp.z - state.z;
    const dist = Math.hypot(dx, dz);
    const isFinalWp = state.waypointIndex === state.waypoints.length - 1;
    const arrivalRadius = isFinalWp ? 0.035 : 0.16;

    if (dist <= arrivalRadius) {
      if (isFinalWp) {
        state.x = wp.x;
        state.z = wp.z;
      }
      state.waypointIndex += 1;
    } else {
      moving = true;
      // Smooth acceleration & arrival deceleration so steps never stop abruptly
      const desiredSpeed = isFinalWp
        ? Math.min(target.walkSpeedMps, Math.max(0.42, dist * 3.4))
        : target.walkSpeedMps;
      const accelAlpha = 1 - Math.exp(-dt * 11);
      state.speedMps = THREE.MathUtils.lerp(
        state.speedMps,
        desiredSpeed,
        accelAlpha,
      );

      const stepDist = Math.min(dist, state.speedMps * dt);
      state.x += (dx / dist) * stepDist;
      state.z += (dz / dist) * stepDist;

      // Turn smoothly toward travel heading while walking (or maintain facing during short strafes)
      const travelYaw = Math.atan2(dx, dz);
      const isShortRetreat = isFinalWp && dist < 0.65;
      const desiredYaw = isShortRetreat ? target.facingYaw : travelYaw;
      const yawDelta = normalizeAngleDelta(desiredYaw - state.yaw);
      const turnAlpha = 1 - Math.exp(-dt * 10.5);
      state.yaw += yawDelta * turnAlpha;

      // Stride cadence coupled directly to real floor velocity (zero foot ice-skating)
      state.stridePhase += stepDist * 4.35;
    }
  }

  if (!moving) {
    state.speedMps *= Math.exp(-dt * 14);
    if (state.speedMps < 0.02) state.speedMps = 0;
    const yawDelta = normalizeAngleDelta(target.facingYaw - state.yaw);
    state.yaw += yawDelta * (1 - Math.exp(-dt * 8.5));
  }

  // Smooth exponential cross-fade between pose modes (walk <-> crouch_gun <-> jack_operate <-> idle)
  const desiredMode: PitCrewPoseMode =
    moving || state.speedMps > 0.22 ? "walk" : target.arrivePose;
  const blendAlpha = 1 - Math.exp(-dt * 7.8);
  let sum = 0;
  for (const k of Object.keys(state.poseWeights) as PitCrewPoseMode[]) {
    const goal = k === desiredMode ? 1 : 0;
    state.poseWeights[k] = THREE.MathUtils.lerp(
      state.poseWeights[k],
      goal,
      blendAlpha,
    );
    sum += state.poseWeights[k];
  }
  if (sum > 1e-6) {
    for (const k of Object.keys(state.poseWeights) as PitCrewPoseMode[]) {
      state.poseWeights[k] /= sum;
    }
  }
}

export interface BoneRestEntry {
  readonly bone: THREE.Bone;
  readonly restPosition: THREE.Vector3;
  readonly restLocalQuaternion: THREE.Quaternion;
  readonly parentRestWorldQuaternion: THREE.Quaternion;
}

const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisZ = new THREE.Vector3(0, 0, 1);
const _qX = new THREE.Quaternion();
const _qY = new THREE.Quaternion();
const _qZ = new THREE.Quaternion();
const _deltaWorld = new THREE.Quaternion();
const _invParentWorld = new THREE.Quaternion();
const _deltaLocal = new THREE.Quaternion();

function lookupBone(
  bones: ReadonlyMap<string, BoneRestEntry>,
  name: string,
): BoneRestEntry | undefined {
  return bones.get(name) ?? bones.get(name.replace(/\./g, ""));
}

function applyCharacterSpaceEuler(
  entry: BoneRestEntry | undefined,
  rx: number,
  ry: number,
  rz: number,
): void {
  if (!entry) return;
  _qX.setFromAxisAngle(_axisX, rx);
  _qY.setFromAxisAngle(_axisY, ry);
  _qZ.setFromAxisAngle(_axisZ, rz);
  _deltaWorld.copy(_qY).multiply(_qX).multiply(_qZ);
  _invParentWorld.copy(entry.parentRestWorldQuaternion).invert();
  // parentLocalDelta = inv(parentWorld) * deltaWorld * parentWorld
  _deltaLocal
    .copy(_invParentWorld)
    .multiply(_deltaWorld)
    .multiply(entry.parentRestWorldQuaternion);
  entry.bone.quaternion.copy(_deltaLocal).multiply(entry.restLocalQuaternion);
}

/**
 * Evaluates full 20-bone articulated skeletal kinematics directly onto the PitCrewArmature
 * by blending idle breathing, velocity-coupled bipedal walking, wheel-gun crouch/recoil,
 * quick-lift jack pumping, and telemetry console operation with zero pose snapping.
 */
export function applyProceduralPitCrewPose(
  bones: ReadonlyMap<string, BoneRestEntry>,
  state: PitCrewLocomotionState,
  holdingGun: boolean,
  workIntensity: number,
  reducedMotion = false,
): void {
  const wIdle = state.poseWeights.idle;
  const wWalk = state.poseWeights.walk;
  const wCrouch = state.poseWeights.crouch_gun;
  const wJack = state.poseWeights.jack_operate;
  const wConsole = state.poseWeights.telemetry_console;

  const t = reducedMotion ? 0.35 : state.idlePhase;
  const sp = state.stridePhase;
  const speedNorm = Math.min(1, state.speedMps / 2.2);

  // ── 1. Walking gait components (velocity-coupled, calibrated to rig skin weights) ──
  const sinS = Math.sin(sp);
  const cosS = Math.cos(sp);
  const walkThighL = -sinS * 0.46 * speedNorm - 0.06 * speedNorm;
  const walkThighR = sinS * 0.46 * speedNorm - 0.06 * speedNorm;
  // Anatomically accurate rearward knee flexion on swing phase (spike-free range)
  const walkShinL = (Math.max(0, cosS) * 0.54 + 0.08) * speedNorm;
  const walkShinR = (Math.max(0, -cosS) * 0.54 + 0.08) * speedNorm;
  const walkFootL = -walkThighL * 0.3 - walkShinL * 0.25;
  const walkFootR = -walkThighR * 0.3 - walkShinR * 0.25;
  const walkHipDrop = -0.02 + Math.abs(sinS) * 0.032 * speedNorm;
  const walkHipRoll = sinS * 0.045 * speedNorm;
  const walkTorsoTwist = -sinS * 0.12 * speedNorm;
  const walkArmL = sinS * 0.42 * speedNorm - 0.1 * speedNorm;
  const walkArmR = holdingGun
    ? -0.36 - sinS * 0.08 * speedNorm
    : -sinS * 0.42 * speedNorm - 0.1 * speedNorm;

  // ── 2. Idle breathing & alert garage scan ─────────────────────────────────
  const breath = Math.sin(t * 2.2) * 0.02;
  const headScan = Math.sin(t * 0.72) * 0.14;

  // ── 3. Wheel-gun athletic crouch + pneumatic impact-wrench recoil ─────────
  const gunBuzz =
    !reducedMotion && workIntensity > 0.65
      ? Math.sin(t * 36) * 0.03 * workIntensity
      : 0;
  // Athletic F1 pit-crew squat calibrated to rig skinning limits with soles on floor
  const crouchHipDrop = -0.23;
  const crouchThigh = -0.82;
  const crouchShin = 1.14;
  const crouchFoot = -0.34;

  // ── 4. Quick-lift jack engagement & rhythmic lever pump ───────────────────
  const jackPump =
    !reducedMotion && workIntensity > 0.6
      ? Math.sin(t * 5.2) * 0.14 * workIntensity
      : 0;
  const jackHipDrop = -0.1 - Math.max(0, jackPump) * 0.12;

  // ── 5. Telemetry console engineer micro-activity ──────────────────────────
  const consoleHeadYaw = Math.sin(t * 1.1) * 0.22;
  const consoleTap = Math.sin(t * 4.4) * 0.05;

  // ── Blend Hips translation & orientation ──────────────────────────────────
  const hipsEntry = lookupBone(bones, "Hips");
  if (hipsEntry) {
    const hipDy =
      wIdle * (breath * 0.25) +
      wWalk * walkHipDrop +
      wCrouch * (crouchHipDrop + gunBuzz * 0.14) +
      wJack * jackHipDrop +
      wConsole * (breath * 0.2);
    hipsEntry.bone.position.set(
      hipsEntry.restPosition.x,
      hipsEntry.restPosition.y + hipDy,
      hipsEntry.restPosition.z,
    );
    const hipRx =
      wWalk * (0.06 * speedNorm) +
      wCrouch * 0.24 +
      wJack * (0.12 - jackPump * 0.28);
    const hipRy = wWalk * (sinS * 0.05 * speedNorm) + wCrouch * 0.06;
    const hipRz = wWalk * walkHipRoll;
    applyCharacterSpaceEuler(hipsEntry, hipRx, hipRy, hipRz);
  }

  // ── Blend Spine, Chest, UpperChest, Neck, Head ────────────────────────────
  const spineRx =
    wIdle * breath +
    wWalk * (0.1 * speedNorm) +
    wCrouch * (0.34 + gunBuzz * 0.22) +
    wJack * (0.22 - jackPump * 0.34) +
    wConsole * (0.14 + breath);
  const spineRy = wWalk * walkTorsoTwist;
  applyCharacterSpaceEuler(
    lookupBone(bones, "Spine"),
    spineRx * 0.55,
    spineRy * 0.5,
    0,
  );
  applyCharacterSpaceEuler(
    lookupBone(bones, "Chest"),
    spineRx * 0.45 + wIdle * breath,
    spineRy * 0.5,
    0,
  );
  applyCharacterSpaceEuler(
    lookupBone(bones, "UpperChest"),
    wCrouch * 0.08 + wConsole * 0.08,
    0,
    0,
  );

  const headRx =
    wCrouch * -0.4 + wJack * -0.16 + wConsole * 0.16 + wIdle * -0.02;
  const headRy =
    wIdle * headScan +
    wConsole * consoleHeadYaw +
    wWalk * (-walkTorsoTwist * 0.6);
  applyCharacterSpaceEuler(
    lookupBone(bones, "Neck"),
    headRx * 0.4,
    headRy * 0.4,
    0,
  );
  applyCharacterSpaceEuler(
    lookupBone(bones, "Head"),
    headRx * 0.6,
    headRy * 0.6,
    0,
  );

  // ── Blend Legs (Thigh, Shin, Foot) ────────────────────────────────────────
  const thighL =
    wIdle * -0.04 +
    wWalk * walkThighL +
    wCrouch * (crouchThigh - 0.06) +
    wJack * -0.42 +
    wConsole * -0.05;
  const thighR =
    wIdle * -0.04 +
    wWalk * walkThighR +
    wCrouch * (crouchThigh + 0.06) +
    wJack * -0.22 +
    wConsole * -0.05;
  const shinL =
    wIdle * 0.06 +
    wWalk * walkShinL +
    wCrouch * (crouchShin + 0.06) +
    wJack * 0.6 +
    wConsole * 0.06;
  const shinR =
    wIdle * 0.06 +
    wWalk * walkShinR +
    wCrouch * (crouchShin - 0.06) +
    wJack * 0.34 +
    wConsole * 0.06;
  const footL =
    wIdle * -0.02 +
    wWalk * walkFootL +
    wCrouch * crouchFoot +
    wJack * -0.18 +
    wConsole * -0.02;
  const footR =
    wIdle * -0.02 +
    wWalk * walkFootR +
    wCrouch * crouchFoot +
    wJack * -0.12 +
    wConsole * -0.02;

  applyCharacterSpaceEuler(
    lookupBone(bones, "Thigh.L"),
    thighL,
    0,
    -0.06 * wCrouch,
  );
  applyCharacterSpaceEuler(lookupBone(bones, "Shin.L"), shinL, 0, 0);
  applyCharacterSpaceEuler(lookupBone(bones, "Foot.L"), footL, 0, 0);

  applyCharacterSpaceEuler(
    lookupBone(bones, "Thigh.R"),
    thighR,
    0,
    0.06 * wCrouch,
  );
  applyCharacterSpaceEuler(lookupBone(bones, "Shin.R"), shinR, 0, 0);
  applyCharacterSpaceEuler(lookupBone(bones, "Foot.R"), footR, 0, 0);

  // ── Blend Arms (UpperArm, Forearm, Hand) ──────────────────────────────────
  // Keep forearm angles smooth and natural so the wheel gun aims horizontally at the hub
  const upperArmLRx =
    wIdle * (holdingGun ? -0.14 : -0.08) +
    wWalk * walkArmL +
    wCrouch * (-0.82 + gunBuzz) +
    wJack * (-0.84 + jackPump * 0.38) +
    wConsole * (-0.58 + consoleTap * 0.25);
  const upperArmRRx =
    wIdle * (holdingGun ? -0.24 : -0.08) +
    wWalk * walkArmR +
    wCrouch * (-0.96 - gunBuzz) +
    wJack * (-0.84 + jackPump * 0.38) +
    wConsole * (-0.64 - consoleTap);

  const upperArmLRy = wCrouch * -0.24 + wJack * -0.14 + wConsole * -0.12;
  const upperArmRRy = wCrouch * 0.2 + wJack * 0.14 + wConsole * 0.16;

  const forearmLRx =
    wIdle * (holdingGun ? -0.18 : -0.12) +
    wWalk * (-0.22 * speedNorm) +
    wCrouch * (-0.28 + gunBuzz * 0.6) +
    wJack * (-0.24 - jackPump * 0.22) +
    wConsole * (-0.52 + consoleTap * 0.3);
  const forearmRRx =
    wIdle * (holdingGun ? -0.16 : -0.12) +
    wWalk * (holdingGun ? -0.18 : -0.22 * speedNorm) +
    wCrouch * (-0.16 - gunBuzz * 0.6) +
    wJack * (-0.24 - jackPump * 0.22) +
    wConsole * (-0.56 + consoleTap * 0.7);

  applyCharacterSpaceEuler(
    lookupBone(bones, "UpperArm.L"),
    upperArmLRx,
    upperArmLRy,
    0,
  );
  applyCharacterSpaceEuler(lookupBone(bones, "Forearm.L"), forearmLRx, 0, 0);
  applyCharacterSpaceEuler(
    lookupBone(bones, "UpperArm.R"),
    upperArmRRx,
    upperArmRRy,
    0,
  );
  applyCharacterSpaceEuler(lookupBone(bones, "Forearm.R"), forearmRRx, 0, 0);
}
