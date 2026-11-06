import * as THREE from 'three';
import type { P1MicroFinish, P1TextureKit } from './P1SurfaceTextures';

export type P1SurfaceMode = 'cinematic' | 'source';

export interface WheelLookRecipe {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  microfinish?: P1MicroFinish;
}

/**
 * P1.6 studio lookdev — material identities are based on ACTUAL R4.5 GLB
 * material names, not guesses about authentic F1 metallurgy or team paint.
 *
 * All recipes are non-destructive and apply to the inspected front-left
 * wheel only. Other chassis and livery surfaces retain their source look.
 */
const recipes: Record<string, WheelLookRecipe> = {
  PEDS_Tire_Rubber: {
    color: '#32363c',
    metalness: 0,
    roughness: 0.93,
    microfinish: 'tyre-grain',
  },
  PEDS_NEW_TITANIUM: {
    color: '#b2bec8',
    metalness: 0.76,
    roughness: 0.29,
    microfinish: 'brushed-metal',
  },
  PEDS_R43_BRUSHED_TITANIUM: {
    color: '#abb8c3',
    metalness: 0.72,
    roughness: 0.41,
    microfinish: 'brushed-metal',
  },
  PEDS_NEW_GRAPHITE: {
    color: '#59636d',
    metalness: 0.27,
    roughness: 0.56,
  },
  PEDS_NEW_BRAKE_CARBON: {
    color: '#41454b',
    metalness: 0.11,
    roughness: 0.86,
    microfinish: 'brake-grain',
  },
  PEDS_NEW_CRIMSON: {
    // Original Crimson material is retained, but with controllable metallic
    // highlights. Do not arbitrarily recolour it into sponsor/team colours.
    color: '#a92f2d',
    metalness: 0.37,
    roughness: 0.40,
    clearcoat: 0.23,
    clearcoatRoughness: 0.30,
  },
};

const compositeArm: WheelLookRecipe = {
  color: '#3e454d',
  metalness: 0.12,
  roughness: 0.72,
};

// The source hub reuses GRAPHITE but is actual mechanical hardware. Separate
// it visually without editing the hub geometry or source material.
const hubGunmetal: WheelLookRecipe = {
  color: '#788590',
  metalness: 0.61,
  roughness: 0.42,
  microfinish: 'brushed-metal',
};

export function pilotRecipeFor(materialName: string, partId: string | null): WheelLookRecipe | null {
  // Keep all non-wheel chassis/paint surfaces exactly as authored.
  if (!partId) return null;
  if (partId === 'FRONT_LEFT_WHEEL.SUSPENSION_LINKS' && materialName === 'PEDS_NEW_TITANIUM') {
    return compositeArm;
  }
  if (partId === 'FRONT_LEFT_WHEEL.WHEEL_HUB' && materialName === 'PEDS_NEW_GRAPHITE') {
    return hubGunmetal;
  }
  return recipes[materialName] ?? null;
}

/**
 * Cloned materials only: mode switches and roughness tiles do not mutate the
 * shared source GLB. The same small textures are shared across all wheel meshes
 * and disposed by their owning P1TextureKit when the lookdev effect unmounts.
 */
export function createPilotMaterial(
  original: THREE.Material,
  partId: string | null,
  mode: P1SurfaceMode = 'cinematic',
  kit?: P1TextureKit,
  hasUV = true,
): THREE.Material {
  const copy = original.clone();
  if (!(copy instanceof THREE.MeshStandardMaterial) || mode === 'source') return copy;
  const recipe = pilotRecipeFor(original.name, partId);
  if (!recipe) return copy;

  copy.color.set(recipe.color);
  copy.metalness = recipe.metalness;
  copy.roughness = recipe.roughness;

  if (copy instanceof THREE.MeshPhysicalMaterial) {
    if (recipe.clearcoat !== undefined) copy.clearcoat = recipe.clearcoat;
    if (recipe.clearcoatRoughness !== undefined) copy.clearcoatRoughness = recipe.clearcoatRoughness;
  }

  if (hasUV && !copy.roughnessMap && recipe.microfinish) {
    const roughnessTile = kit?.tiles.get(recipe.microfinish);
    if (roughnessTile) copy.roughnessMap = roughnessTile;
  }

  return copy;
}

export const PILOT_RECIPE_COUNT = Object.keys(recipes).length;
