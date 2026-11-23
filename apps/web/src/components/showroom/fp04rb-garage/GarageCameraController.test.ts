import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  BAY_X,
  clampCameraPositionToGarage,
  resolveGarageCameraPreset,
} from "./garageCameraMath";
import {
  GARAGE_CAMERA_PRESETS,
  INSPECTION_PARTS,
  PRD_34_CAMERA_PRESETS,
  PRD_9_PAINT_REVIEW_ANGLES,
} from "./inspectionParts";

describe("GarageCameraController & collision bounds", () => {
  it("resolves all 7 toolbar presets and all 9 PRD §6 paint-review angles inside garage limits for both Bay 1 and Bay 2", () => {
    expect(GARAGE_CAMERA_PRESETS).toHaveLength(7);
    expect(PRD_34_CAMERA_PRESETS).toHaveLength(4);
    expect(PRD_9_PAINT_REVIEW_ANGLES).toHaveLength(9);

    const allPresetIds = new Set([
      ...GARAGE_CAMERA_PRESETS.map((p) => p.id),
      ...PRD_9_PAINT_REVIEW_ANGLES,
    ]);

    for (const bayFocus of ["bay-1", "bay-2"] as const) {
      for (const presetId of allPresetIds) {
        const pose = resolveGarageCameraPreset({
          preset: presetId,
          bayFocus,
          mode: "overview",
          selectedPartId: "front-wing",
          maintenanceCorner: "FL",
        });

        expect(pose.position.x).toBeGreaterThanOrEqual(-7.45);
        expect(pose.position.x).toBeLessThanOrEqual(7.45);
        expect(pose.position.y).toBeGreaterThanOrEqual(0.34);
        expect(pose.position.y).toBeLessThanOrEqual(4.38);
        expect(pose.position.z).toBeGreaterThanOrEqual(-5.15);
        expect(pose.position.z).toBeLessThanOrEqual(5.75);
      }
    }
  });

  it("pushes out cameras that try to penetrate walls or car chassis hulls", () => {
    const insideWall = clampCameraPositionToGarage(
      new THREE.Vector3(-12, 0.02, -9),
    );
    expect(insideWall.x).toBe(-7.45);
    expect(insideWall.y).toBe(0.34);
    expect(insideWall.z).toBe(-5.15);

    // Attempt to clip directly inside Bay 1 chassis monocoque
    const insideCar = clampCameraPositionToGarage(
      new THREE.Vector3(BAY_X.bay1 + 0.1, 0.55, -0.35),
    );
    const cleared =
      Math.abs(insideCar.x - BAY_X.bay1) >= 1.14 || insideCar.y >= 1.24;
    expect(cleared).toBe(true);
  });

  it("marks 6 supported external assemblies and 4 truthful unsupported internal items", () => {
    const supported = INSPECTION_PARTS.filter((p) => p.supported);
    const unsupported = INSPECTION_PARTS.filter((p) => !p.supported);
    expect(supported).toHaveLength(6);
    expect(unsupported).toHaveLength(4);
    for (const item of unsupported) {
      expect(item.nodeName).toBeNull();
      expect(item.unsupportedReason?.en.length).toBeGreaterThan(10);
    }
  });
});
