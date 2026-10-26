import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { disposeModelB, prepareModelB } from "./modelBLoader";

describe("shared Model B preparation and cleanup", () => {
  it("normalizes a loaded scene without mutating the source material", () => {
    const original = new THREE.MeshStandardMaterial({ color: "#ffffff" });
    const scene = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 4), original);
    scene.add(mesh);
    prepareModelB(scene);
    const bounds = new THREE.Box3().setFromObject(scene);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(
      Math.max(...bounds.getSize(new THREE.Vector3()).toArray()),
    ).toBeCloseTo(5.05);
    expect(mesh.material).not.toBe(original);
    disposeModelB(scene);
    original.dispose();
  });

  it("disposes every geometry and owned material on unmount", () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial();
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeMaterial = vi.spyOn(material, "dispose");
    const scene = new THREE.Group();
    scene.add(new THREE.Mesh(geometry, material));
    disposeModelB(scene);
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
  });
});
