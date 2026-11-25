import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { BAY_X, CAR_Z_CENTER } from "./garageCameraMath";
import {
  applyProceduralPitCrewPose,
  buildCrewBayPath,
  createInitialLocomotionState,
  getFrontJackOperatorTarget,
  getRearJackOperatorTarget,
  getWheelGunnerTarget,
  stepCrewLocomotion,
  type BoneRestEntry,
} from "./pitCrewLocomotion";
import {
  advanceMaintenance,
  computeMaintenanceTransforms,
  createInitialMaintenanceState,
  startMaintenance,
} from "./ServiceSequence";

function buildSyntheticCrewBones(): Map<string, BoneRestEntry> {
  const names = [
    "Hips",
    "Spine",
    "Chest",
    "UpperChest",
    "Neck",
    "Head",
    "UpperArm.L",
    "Forearm.L",
    "UpperArm.R",
    "Forearm.R",
    "Thigh.L",
    "Shin.L",
    "Foot.L",
    "Thigh.R",
    "Shin.R",
    "Foot.R",
  ];
  const map = new Map<string, BoneRestEntry>();
  for (const name of names) {
    const bone = new THREE.Bone();
    bone.name = name;
    if (name === "Hips") bone.position.set(0, 0.832, 0.017);
    map.set(name, {
      bone,
      restPosition: bone.position.clone(),
      restLocalQuaternion: bone.quaternion.clone(),
      parentRestWorldQuaternion: new THREE.Quaternion(),
    });
  }
  return map;
}

describe("pitCrewLocomotion — smooth collision-free walking & skeletal kinematics", () => {
  it("routes wheel gunner around Bay 1 F1 car hull rather than walking through the chassis", () => {
    const standby = { x: BAY_X.bay1 - 2.35, z: CAR_Z_CENTER - 2.9 };
    const flWork = { x: BAY_X.bay1 + 1.62, z: CAR_Z_CENTER + 1.66 };
    const path = buildCrewBayPath(standby, flWork);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[path.length - 1]).toEqual(flWork);

    // Every intermediate waypoint stays outside the Bay 1 F1 car obstacle envelope
    for (const wp of path) {
      const insideCar =
        Math.abs(wp.x - BAY_X.bay1) < 1.35 &&
        wp.z > CAR_Z_CENTER - 2.6 &&
        wp.z < CAR_Z_CENTER + 2.9;
      expect(insideCar).toBe(false);
    }
  });

  it("moves smoothly frame-by-frame without teleportation and blends walk -> crouch_gun on arrival", () => {
    const idleState = createInitialMaintenanceState(true);
    const startTarget = getWheelGunnerTarget(idleState);
    const loco = createInitialLocomotionState(
      startTarget.position.x,
      startTarget.position.z,
      startTarget.facingYaw,
      startTarget.arrivePose,
    );

    const activeState = startMaintenance(idleState, "FL");
    const workTarget = getWheelGunnerTarget(activeState);

    let maxStepDist = 0;
    let peakWalkWeight = 0;
    let peakSpeed = 0;

    // Simulate 95 frames (~1.58s at 60fps — right inside APPROACH_JACKS duration)
    for (let i = 0; i < 95; i += 1) {
      const prevX = loco.x;
      const prevZ = loco.z;
      stepCrewLocomotion(loco, workTarget, 1 / 60, true, false);
      const stepDist = Math.hypot(loco.x - prevX, loco.z - prevZ);
      maxStepDist = Math.max(maxStepDist, stepDist);
      peakWalkWeight = Math.max(peakWalkWeight, loco.poseWeights.walk);
      peakSpeed = Math.max(peakSpeed, loco.speedMps);
    }

    // Zero teleportation: per-frame displacement bounded by walkSpeed * dt
    expect(maxStepDist).toBeGreaterThan(0.015);
    expect(maxStepDist).toBeLessThan(0.07);
    expect(peakSpeed).toBeGreaterThan(1.5);
    expect(peakWalkWeight).toBeGreaterThan(0.7);
    expect(loco.stridePhase).toBeGreaterThan(3);

    // Settled cleanly at FL station within APPROACH_JACKS duration
    expect(
      Math.hypot(
        loco.x - workTarget.position.x,
        loco.z - workTarget.position.z,
      ),
    ).toBeLessThan(0.05);

    // Step another 45 frames to settle crouch cross-fade
    for (let i = 0; i < 45; i += 1) {
      stepCrewLocomotion(loco, workTarget, 1 / 60, true, false);
    }
    expect(loco.poseWeights.crouch_gun).toBeGreaterThan(0.85);
  });

  it("articulates Hips, Thighs, Shins, and Arms away from static rest pose during walk and crouch", () => {
    const bones = buildSyntheticCrewBones();
    const loco = createInitialLocomotionState(0, 0, 0, "walk");
    loco.speedMps = 2.4;
    loco.stridePhase = Math.PI * 0.5;
    loco.poseWeights = {
      idle: 0,
      walk: 1,
      crouch_gun: 0,
      jack_operate: 0,
      telemetry_console: 0,
    };

    applyProceduralPitCrewPose(bones, loco, true, 0, false);
    const thighLWalk = bones.get("Thigh.L")!.bone.quaternion.clone();
    const thighRWalk = bones.get("Thigh.R")!.bone.quaternion.clone();
    // Opposite legs swing in opposite directions while walking
    expect(thighLWalk.angleTo(new THREE.Quaternion())).toBeGreaterThan(0.35);
    expect(thighRWalk.angleTo(thighLWalk)).toBeGreaterThan(0.7);

    // Crouch lowers hips significantly and bends knees
    loco.speedMps = 0;
    loco.poseWeights = {
      idle: 0,
      walk: 0,
      crouch_gun: 1,
      jack_operate: 0,
      telemetry_console: 0,
    };
    applyProceduralPitCrewPose(bones, loco, true, 1.0, false);
    expect(bones.get("Hips")!.bone.position.y).toBeLessThan(0.62);
    expect(
      bones.get("Shin.L")!.bone.quaternion.angleTo(new THREE.Quaternion()),
    ).toBeGreaterThan(1.0);

    // Regression: Three.js GLTFLoader sanitizes dotted Blender bone names ("Thigh.L" -> "ThighL")
    const sanitizedBones = new Map<string, BoneRestEntry>();
    for (const [key, entry] of bones.entries()) {
      sanitizedBones.set(key.replace(/\./g, ""), entry);
    }
    const shinBefore = sanitizedBones
      .get("ShinL")!
      .bone.quaternion.identity()
      .clone();
    applyProceduralPitCrewPose(sanitizedBones, loco, true, 1.0, false);
    expect(
      sanitizedBones.get("ShinL")!.bone.quaternion.angleTo(shinBefore),
    ).toBeGreaterThan(1.0);
    expect(
      sanitizedBones
        .get("UpperArmR")!
        .bone.quaternion.angleTo(new THREE.Quaternion()),
    ).toBeGreaterThan(0.8);
  });

  it("assigns synchronized Front & Rear Jack operator poses during LIFT_CAR", () => {
    const liftState = {
      ...startMaintenance(createInitialMaintenanceState(true), "FL"),
      step: "LIFT_CAR" as const,
      stepProgress: 0.5,
    };
    const front = getFrontJackOperatorTarget(BAY_X.bay1, 2.95, liftState);
    const rear = getRearJackOperatorTarget(BAY_X.bay1, -2.5, liftState);
    expect(front.arrivePose).toBe("jack_operate");
    expect(rear.arrivePose).toBe("jack_operate");
    expect(front.workIntensity).toBe(1);
    expect(rear.workIntensity).toBe(1);
  });

  it("clears the wheel extraction corridor before the detached wheel slides out and supports Bay 2 service", () => {
    for (const bay of ["bay-1", "bay-2"] as const) {
      const bx = bay === "bay-1" ? BAY_X.bay1 : BAY_X.bay2;
      for (const corner of ["FL", "FR", "RL", "RR"] as const) {
        const isFront = corner.startsWith("F");
        const sideSign = corner.endsWith("L") ? 1 : -1;
        const wheelZ = CAR_Z_CENTER + (isFront ? 1.799 : -1.8);
        const tyreOuterX = isFront ? 1.016 : 1.054;

        let mState = startMaintenance(
          createInitialMaintenanceState(true),
          corner,
        );
        const startTgt = getWheelGunnerTarget(
          createInitialMaintenanceState(true),
          bay,
        );
        const loco = createInitialLocomotionState(
          startTgt.position.x,
          startTgt.position.z,
          startTgt.facingYaw,
          startTgt.arrivePose,
        );

        let checkedDetachedFrames = 0;
        const dtSec = 1 / 60;
        for (let frame = 0; frame < 600 && mState.step !== "IDLE"; frame += 1) {
          mState = advanceMaintenance(mState, dtSec * 1000);
          const tgt = getWheelGunnerTarget(mState, bay);
          stepCrewLocomotion(loco, tgt, dtSec, true, false);
          const xforms = computeMaintenanceTransforms(mState);

          if (xforms.wheelOutwardOffsetMeters > 0.02) {
            checkedDetachedFrames += 1;
            const extractedOuterX =
              bx + sideSign * (tyreOuterX + xforms.wheelOutwardOffsetMeters);
            const dxFromTyre = (loco.x - extractedOuterX) * sideSign;
            const dzFromTyre = Math.abs(loco.z - wheelZ);
            // Mechanic must never overlap the extracted wheel volume (either clearly outside X or clearly outside Z radius)
            const safelyClear = dxFromTyre >= 0.45 || dzFromTyre >= 0.65;
            expect(safelyClear).toBe(true);
          }
        }
        expect(checkedDetachedFrames).toBeGreaterThan(100);
      }
    }
  });
});
