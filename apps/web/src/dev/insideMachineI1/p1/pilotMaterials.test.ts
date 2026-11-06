import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { PILOT_RECIPE_COUNT, createPilotMaterial, pilotRecipeFor } from './pilotMaterials';

describe('P1.1 lookdev materials stay isolated from source meshes', () => {
  it('has independent material families for wheel, tire, brakes and caliper', () => {
    expect(PILOT_RECIPE_COUNT).toBeGreaterThanOrEqual(6);
    const tire = pilotRecipeFor('PEDS_Tire_Rubber', 'FRONT_LEFT_WHEEL.WHEEL_OUTER');
    const disc = pilotRecipeFor('PEDS_NEW_BRAKE_CARBON', 'FRONT_LEFT_WHEEL.BRAKE_DISC');
    const caliper = pilotRecipeFor('PEDS_NEW_CRIMSON', 'FRONT_LEFT_WHEEL.BRAKE_CALIPER');
    expect(tire?.metalness).toBe(0);
    expect(tire?.roughness).toBeGreaterThan(0.8);
    expect(disc?.metalness).toBeLessThan(0.2);
    expect(caliper?.color).toBe('#a92f2d');
  });

  it('treats newly designed suspension composite as a proposal, not shared titanium', () => {
    const arm = pilotRecipeFor('PEDS_NEW_TITANIUM', 'FRONT_LEFT_WHEEL.SUSPENSION_LINKS');
    const nut = pilotRecipeFor('PEDS_NEW_TITANIUM', 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT');
    expect(arm?.metalness).toBeLessThan(0.3);
    expect(nut?.metalness).toBeGreaterThan(0.6);
  });

  it('clones and never mutates the original GLB material', () => {
    const original = new THREE.MeshPhysicalMaterial({
      name: 'PEDS_NEW_BRAKE_CARBON',
      color: '#181c20',
      metalness: 0.5,
      roughness: 0.4,
    });
    const before = original.color.getHexString();
    const revised = createPilotMaterial(original, 'FRONT_LEFT_WHEEL.BRAKE_DISC');
    expect(revised).not.toBe(original);
    expect(original.color.getHexString()).toBe(before);
    expect(original.metalness).toBe(0.5);
    expect((revised as THREE.MeshStandardMaterial).roughness).toBeGreaterThan(0.7);
    revised.dispose();
    original.dispose();
  });
});
