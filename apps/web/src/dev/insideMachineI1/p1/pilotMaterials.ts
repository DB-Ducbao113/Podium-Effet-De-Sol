import * as THREE from 'three';

export interface WheelLookRecipe {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
}

/**
 * Proposed P1.1 lookdev only. Appearance is not evidence for authentic F1 alloys.
 * Original glTF materials remain unchanged in the loaded source.
 */
const recipes: Record<string, WheelLookRecipe> = {
  PEDS_Tire_Rubber: {
    color: '#2c323a',
    metalness: 0,
    roughness: 0.88,
  },
  PEDS_NEW_TITANIUM: {
    color: '#9cabb7',
    metalness: 0.68,
    roughness: 0.32,
  },
  PEDS_R43_BRUSHED_TITANIUM: {
    color: '#acb9c5',
    metalness: 0.72,
    roughness: 0.39,
  },
  PEDS_NEW_GRAPHITE: {
    color: '#4d5a67',
    metalness: 0.24,
    roughness: 0.54,
  },
  PEDS_NEW_BRAKE_CARBON: {
    color: '#343941',
    metalness: 0.14,
    roughness: 0.81,
  },
  PEDS_NEW_CRIMSON: {
    color: '#a92f2d',
    metalness: 0.35,
    roughness: 0.46,
  },
};

/** Distinguish composite arm surfaces while leaving the source geometry intact. */
const compositeArm: WheelLookRecipe = {
  color: '#333d49',
  metalness: 0.12,
  roughness: 0.68,
};

export function pilotRecipeFor(materialName: string, partId: string | null): WheelLookRecipe | null {
  if (partId === 'FRONT_LEFT_WHEEL.SUSPENSION_LINKS' && materialName === 'PEDS_NEW_TITANIUM') {
    return compositeArm;
  }
  return recipes[materialName] ?? null;
}

/** Never mutate a shared material: all the P1.1 overrides live on clones. */
export function createPilotMaterial(original: THREE.Material, partId: string | null): THREE.Material {
  const copy = original.clone();
  if (!(copy instanceof THREE.MeshStandardMaterial)) return copy;
  const recipe = pilotRecipeFor(original.name, partId);
  if (!recipe) return copy;
  copy.color.set(recipe.color);
  copy.metalness = recipe.metalness;
  copy.roughness = recipe.roughness;
  if (copy instanceof THREE.MeshPhysicalMaterial) {
    if (recipe.clearcoat !== undefined) copy.clearcoat = recipe.clearcoat;
    if (recipe.clearcoatRoughness !== undefined) copy.clearcoatRoughness = recipe.clearcoatRoughness;
  }
  return copy;
}

export const PILOT_RECIPE_COUNT = Object.keys(recipes).length;
