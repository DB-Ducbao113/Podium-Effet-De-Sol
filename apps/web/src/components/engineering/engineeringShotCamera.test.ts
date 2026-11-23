import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  fitEngineeringCameraToBounds,
  interpolateEngineeringCameraFrames,
  shouldEnterEngineeringOrbitFromDrag,
  type EngineeringSafeViewRegion,
} from "./engineeringShotCamera";

function expectBoundsInsideSafeRegion(
  bounds: THREE.Box3,
  frame: NonNullable<ReturnType<typeof fitEngineeringCameraToBounds>>,
  width: number,
  height: number,
  fov: number,
  region: EngineeringSafeViewRegion,
) {
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 100);
  camera.position.copy(frame.position);
  camera.lookAt(frame.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const projected = new THREE.Vector3(x, y, z).project(camera);
        const screenX = (projected.x + 1) / 2;
        const screenY = (1 - projected.y) / 2;
        expect(screenX).toBeGreaterThanOrEqual(region.left - 0.015);
        expect(screenX).toBeLessThanOrEqual(region.left + region.width + 0.015);
        expect(screenY).toBeGreaterThanOrEqual(region.top - 0.015);
        expect(screenY).toBeLessThanOrEqual(region.top + region.height + 0.015);
      }
    }
  }
}

describe("Engineering measured camera framing", () => {
  it("contains the full scene when the point of interest is off centre", () => {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-4, -1, -3),
      new THREE.Vector3(4, 2, 3),
    );
    const targetBounds = new THREE.Box3(
      new THREE.Vector3(8, 0, 1),
      new THREE.Vector3(9, 1, 2),
    );
    const safe = { left: 0.06, top: 0.24, width: 0.88, height: 0.4 };
    const frame = fitEngineeringCameraToBounds(bounds, {
      viewportWidth: 390,
      viewportHeight: 780,
      safeRegion: safe,
      direction: [-0.68, 0.34, -0.66],
      fov: 35,
      framing: 1.12,
      lookTargetBias: [0, 0, 0],
      targetBounds,
    });
    expect(frame).not.toBeNull();
    expectBoundsInsideSafeRegion(bounds, frame!, 390, 780, 35, safe);
  });
  it.each([
    {
      width: 1440,
      height: 900,
      safe: { left: 0.39, top: 0.08, width: 0.56, height: 0.82 },
    },
    {
      width: 390,
      height: 844,
      safe: { left: 0.06, top: 0.28, width: 0.88, height: 0.43 },
    },
  ])(
    "keeps measured bounds inside the clear region at $width×$height",
    ({ width, height, safe }) => {
      const bounds = new THREE.Box3(
        new THREE.Vector3(-0.82, -0.48, -0.3),
        new THREE.Vector3(0.82, 0.48, 0.3),
      );
      const frame = fitEngineeringCameraToBounds(bounds, {
        viewportWidth: width,
        viewportHeight: height,
        safeRegion: safe,
        direction: [-0.82, 0.34, -0.45],
        fov: 32,
        framing: 1.18,
        lookTargetBias: [0, 0, 0],
      });

      expect(frame).not.toBeNull();
      expectBoundsInsideSafeRegion(bounds, frame!, width, height, 32, safe);
    },
  );

  it("returns an exact reversible curved path between scroll camera anchors", () => {
    const from = {
      position: new THREE.Vector3(-4, 1.5, -4),
      target: new THREE.Vector3(0, 0.4, 0),
      distance: 5.8,
    };
    const to = {
      position: new THREE.Vector3(4.2, 1.9, 2.8),
      target: new THREE.Vector3(1.1, 0.3, 1.4),
      distance: 5.2,
    };
    const midpoint = interpolateEngineeringCameraFrames(from, to, 0.5, 2.2);
    const reverseMidpoint = interpolateEngineeringCameraFrames(
      to,
      from,
      0.5,
      2.2,
    );

    expect(midpoint.position.y).toBeGreaterThan(
      (from.position.y + to.position.y) / 2,
    );
    expect(midpoint.position.distanceTo(reverseMidpoint.position)).toBeLessThan(
      1e-9,
    );
    expect(midpoint.target.distanceTo(reverseMidpoint.target)).toBeLessThan(
      1e-9,
    );
    expect(
      interpolateEngineeringCameraFrames(from, to, 0, 2.2).position.distanceTo(
        from.position,
      ),
    ).toBe(0);
    expect(
      interpolateEngineeringCameraFrames(from, to, 1, 2.2).position.distanceTo(
        to.position,
      ),
    ).toBe(0);
  });
});

describe("Engineering Orbit pointer intent", () => {
  it("keeps vertical touch swipes for story scroll and uses horizontal drags for Orbit", () => {
    expect(shouldEnterEngineeringOrbitFromDrag("touch", 2, 24)).toBe(false);
    expect(shouldEnterEngineeringOrbitFromDrag("touch", 18, 6)).toBe(true);
    expect(shouldEnterEngineeringOrbitFromDrag("touch", 6, 0)).toBe(false);
  });

  it("keeps mouse drags omnidirectional for Orbit", () => {
    expect(shouldEnterEngineeringOrbitFromDrag("mouse", 0, 7)).toBe(true);
    expect(shouldEnterEngineeringOrbitFromDrag("mouse", 2, 3)).toBe(false);
  });
});
