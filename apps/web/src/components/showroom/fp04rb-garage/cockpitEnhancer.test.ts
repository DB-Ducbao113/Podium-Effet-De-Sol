import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  COCKPIT_PRESERVE_EMISSIVE_KEY,
  enhanceShowroomCockpitMaterials,
} from "./cockpitEnhancer";
import type { Fp04rbCarInstance } from "./fp04rbLoader";
import { getTeam2026ById } from "./teams2026";

function buildSyntheticCockpitCar(): {
  instance: Fp04rbCarInstance;
  matsByName: Map<string, THREE.MeshStandardMaterial>;
} {
  const root = new THREE.Group();
  const cockpitGroup = new THREE.Group();
  cockpitGroup.name = "PART_COCKPIT";
  root.add(cockpitGroup);

  const matNames = [
    "display_screen.001",
    "glass_clear_headlight.001",
    "Translucent Plastic_green",
    "Translucent Plastic_blue",
    "Translucent Plastic_yellow",
    "Translucent Plastic_red",
    "steering_wheel_stickers.001",
    "Fabric_seatbelts",
    "Anodized Metal_grey",
    "AnodizedMetal_grey",
    "AnodizedMetal_grey.001",
    "BMD_Brass.001",
    "cockpit_foam_texture",
    "BMD_Felt_0018",
    "Rubber.002",
    "Carbon Fiber (no UV)",
    "Carbon Fiber (no UV)_rough.002",
  ];

  const matsByName = new Map<string, THREE.MeshStandardMaterial>();
  for (const name of matNames) {
    const mat = new THREE.MeshStandardMaterial({
      name,
      color: new THREE.Color(0.05, 0.05, 0.06),
      metalness: name === "cockpit_foam_texture" ? 0.9 : 0.08,
      roughness: 0.42,
    });
    matsByName.set(name, mat);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat);
    mesh.name = `mesh_${name}`;
    cockpitGroup.add(mesh);
  }

  const instance = {
    lod: "desktop",
    root,
    chassisRoot: null,
    drsFlapPivot: null,
    partNodes: { PART_COCKPIT: cockpitGroup },
    corners: {} as Fp04rbCarInstance["corners"],
    paintMaterials: new Map(),
    ownedMaterials: Array.from(matsByName.values()),
    ownedTextures: [],
    triangles: 100,
    meshCount: matNames.length,
  } as Fp04rbCarInstance;

  return { instance, matsByName };
}

describe("cockpitEnhancer — Engineering-grade Showroom cockpit material upgrade", () => {
  it("calibrates OLED display, 15 shift LEDs, FIA crimson harness, anodized gold/titanium/brass, and matte foam", () => {
    const { instance, matsByName } = buildSyntheticCockpitCar();
    const mclaren = getTeam2026ById("mclaren");

    const count = enhanceShowroomCockpitMaterials(instance, mclaren, "bay-1");
    expect(count).toBe(matsByName.size);

    // OLED Display emits brightly and is marked preserve-emissive
    const oled = matsByName.get("display_screen.001")!;
    expect(oled.emissiveIntensity).toBeGreaterThan(1.0);
    expect(oled.userData[COCKPIT_PRESERVE_EMISSIVE_KEY]).toBe(true);

    // All 4 shift LED color bands emit vividly and preserve emissive
    for (const ledName of [
      "Translucent Plastic_green",
      "Translucent Plastic_blue",
      "Translucent Plastic_yellow",
      "Translucent Plastic_red",
    ]) {
      const led = matsByName.get(ledName)!;
      expect(led.emissiveIntensity).toBeGreaterThanOrEqual(1.3);
      expect(led.userData[COCKPIT_PRESERVE_EMISSIVE_KEY]).toBe(true);
    }

    // FIA crimson seatbelts instead of flat black
    const belts = matsByName.get("Fabric_seatbelts")!;
    expect(belts.color.r).toBeGreaterThan(0.4);
    expect(belts.color.g).toBeLessThan(0.1);

    // Machined brass & titanium & anodized gold buckle
    expect(matsByName.get("BMD_Brass.001")!.metalness).toBeGreaterThanOrEqual(
      0.85,
    );
    expect(
      matsByName.get("Anodized Metal_grey")!.metalness,
    ).toBeGreaterThanOrEqual(0.8);
    expect(
      matsByName.get("AnodizedMetal_grey.001")!.metalness,
    ).toBeGreaterThanOrEqual(0.85);

    // Headrest foam metalness bug (0.90 chrome) fixed to matte foam
    expect(matsByName.get("cockpit_foam_texture")!.metalness).toBeLessThan(0.1);
    expect(matsByName.get("cockpit_foam_texture")!.roughness).toBeGreaterThan(
      0.6,
    );

    // Clear OLED glass stays transparent with depthWrite=false
    const glass = matsByName.get("glass_clear_headlight.001")!;
    expect(glass.transparent).toBe(true);
    expect(glass.depthWrite).toBe(false);
    expect(glass.opacity).toBeLessThanOrEqual(0.15);
  });
});
