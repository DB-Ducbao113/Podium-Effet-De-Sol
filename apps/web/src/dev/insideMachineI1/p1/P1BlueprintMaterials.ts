import * as THREE from 'three';

export interface P1SurfaceSnapshot {
  material: THREE.Material;
  color: THREE.Color | null;
  metalness: number | null;
  roughness: number | null;
  technicalColor: THREE.Color;
}

const neutral = new THREE.Color('#b7c6cf');
const mechanical = new THREE.Color('#d4e2e9');
const focus = new THREE.Color('#e8f2f5');

/**
 * Keep a single source GLB mesh hierarchy: adjust material attributes
 * instead of creating a second fully triangulated car to mimic CAD.
 * The user-supplied reference switches studio/CAD looks on the SAME mesh.
 */
export function snapshotP1Surface(
  material: THREE.Material,
  partId: string | null,
): P1SurfaceSnapshot {
  const standard = material instanceof THREE.MeshStandardMaterial;
  const currentColor =
    material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial
      ? material.color.clone()
      : null;

  return {
    material,
    color: currentColor,
    metalness: standard ? material.metalness : null,
    roughness: standard ? material.roughness : null,
    technicalColor: (partId === 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT'
      ? focus
      : partId ? mechanical : neutral).clone(),
  };
}

export function applyP1BlueprintSurfaces(
  records: readonly P1SurfaceSnapshot[],
  value: number,
): void {
  const intensity = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  for (const record of records) {
    const { material, color } = record;
    if (color && (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial)) {
      material.color.copy(color).lerp(record.technicalColor, intensity);
    }
    if (record.metalness !== null && material instanceof THREE.MeshStandardMaterial) {
      material.metalness = THREE.MathUtils.lerp(record.metalness, 0.02, intensity);
      material.roughness = THREE.MathUtils.lerp(record.roughness ?? 0.8, 0.94, intensity);
    }
  }
}
