import * as THREE from 'three';
import type { QualityProfile } from '../types';

export type P1MicroFinish = 'tyre-grain' | 'brake-grain' | 'brushed-metal';

const TILE_SIZE: Record<QualityProfile, number> = {
  HIGH: 128,
  BALANCED: 64,
  PERFORMANCE: 0,
};

/** Bounded deterministic grain; a roughness-only effect, NOT physical geometry. */
function noise(x: number, y: number, seed: number): number {
  let h = Math.imul(x + seed * 97, 374761393) + Math.imul(y + seed * 13, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function roughnessByte(x: number, y: number, kind: P1MicroFinish): number {
  const grain = noise(x, y, kind === 'tyre-grain' ? 13 : kind === 'brake-grain' ? 29 : 47);
  if (kind === 'tyre-grain') {
    // Soft granular variation; preserve tyre form and real UV-bound silhouettes.
    const fleck = noise(Math.floor(x / 3), Math.floor(y / 3), 7);
    return Math.round(222 + grain * 16 + fleck * 9);
  }
  if (kind === 'brake-grain') {
    // Fine carbon-brake roughness only, NOT vent topology or drilled geometry.
    const lowFrequency = noise(Math.floor(x / 5), Math.floor(y / 5), 21);
    return Math.round(218 + grain * 14 + lowFrequency * 18);
  }
  // UV-aligned satin brushed metal micro-variation. Not physical machining.
  const stripe = noise(0, y, 61);
  return Math.round(219 + stripe * 26 + grain * 6);
}

/**
 * Tiny colourless DataTexture used as glTF roughnessMap.
 * Redundant per-mesh textures would increase memory/draw-state churn, so
 * each quality tier shares one instance per finish family.
 */
export function makeP1RoughnessTile(
  kind: P1MicroFinish,
  size: number,
): THREE.DataTexture {
  if (!Number.isInteger(size) || size < 8 || size > 256) {
    throw new RangeError('P1 roughness tile must be between 8 and 256 pixels');
  }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const value = roughnessByte(x, y, kind);
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.name = `PEDS_P1_6_${kind}_roughness`;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === 'brushed-metal' ? 5 : 3, kind === 'brushed-metal' ? 3 : 3);
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

export interface P1TextureKit {
  readonly tiles: ReadonlyMap<P1MicroFinish, THREE.DataTexture>;
  dispose(): void;
}

export function createP1TextureKit(profile: QualityProfile): P1TextureKit {
  const size = TILE_SIZE[profile];
  const tiles = new Map<P1MicroFinish, THREE.DataTexture>();
  if (size > 0) {
    (['tyre-grain', 'brake-grain', 'brushed-metal'] as const).forEach((kind) => {
      tiles.set(kind, makeP1RoughnessTile(kind, size));
    });
  }
  return {
    tiles,
    dispose: () => {
      tiles.forEach((tile) => tile.dispose());
      tiles.clear();
    },
  };
}
