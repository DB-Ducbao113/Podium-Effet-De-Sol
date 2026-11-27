import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  ENG_LIVERY_PALETTE,
  applyEngineeringPodiumLiveryToMaterial,
  createEngineeringPodiumLiveryBundle,
} from "./engineeringPodiumLivery";

describe("engineeringPodiumLivery · Concept A Storm Midnight Stealth", () => {
  it("re-brands every Audi/Ferrari exterior material and preserves mechanical materials untouched", () => {
    const bundle = createEngineeringPodiumLiveryBundle(4);
    const offset = new THREE.Vector3(-0.4, 0.45, 0.58);

    const brandedNames = [
      "main_body_texture",
      "front_wing_texture",
      "rear_wing_texture",
      "floor_texture",
      "wheel_covers_texture",
      "wheel_covers_texture.001",
      "Paint_wheel_cover",
      "reflex_yellow",
      "audi_red",
      "audi_white",
      "mirrors_texture",
      "winglets_texture",
      "ferrari-logo-png-transparent",
    ];

    for (const matName of brandedNames) {
      const mat = new THREE.MeshStandardMaterial({ name: matName });
      const applied = applyEngineeringPodiumLiveryToMaterial(mat, offset, bundle);
      expect(applied).toBe(true);
      mat.dispose();
    }

    const mechanical = new THREE.MeshStandardMaterial({
      name: "SE_Titanium_Machined",
    });
    expect(
      applyEngineeringPodiumLiveryToMaterial(mechanical, offset, bundle),
    ).toBe(false);
    mechanical.dispose();

    const wheelRim = new THREE.MeshStandardMaterial({ name: "reflex_yellow" });
    applyEngineeringPodiumLiveryToMaterial(wheelRim, offset, bundle);
    expect(`#${wheelRim.color.getHexString()}`).toBe(
      ENG_LIVERY_PALETTE.aeroCyan,
    );
    wheelRim.dispose();

    bundle.dispose();
  });
});
