import * as THREE from 'three';
import type { ModelBLivery } from './modelBExperience';

export interface ModelBMaterialTreatment {
  color: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
}

export function getModelBMaterialTreatment(
  materialName: string,
  livery: Pick<ModelBLivery, 'primary' | 'secondary' | 'accent' | 'roughness' | 'metalness' | 'clearcoat'> & Partial<Pick<ModelBLivery, 'carbon'>>,
): ModelBMaterialTreatment | null {
  switch (materialName) {
    case 'PEDS_Graphite_Auto_Paint':
      return {
        color: livery.primary,
        roughness: livery.roughness,
        metalness: livery.metalness,
        clearcoat: livery.clearcoat,
      };
    case 'PEDS_Crimson_Accent':
      return {
        color: livery.accent,
        roughness: Math.max(0.18, livery.roughness * 0.75),
        metalness: Math.max(0.32, livery.metalness),
        clearcoat: Math.max(0.7, livery.clearcoat),
      };
    case 'PEDS_Gunmetal_Satin':
      return {
        color: livery.secondary,
        roughness: Math.max(0.42, livery.roughness),
        metalness: 0.56,
        clearcoat: 0.24,
      };
    case 'PEDS_Titanium_Satin':
      return {
        color: '#aeb7c4',
        roughness: 0.34,
        metalness: 0.78,
        clearcoat: 0.18,
      };
    case 'PEDS_Carbon_Composite':
      return {
        color: livery.carbon ?? '#101318',
        roughness: 0.62,
        metalness: 0.16,
        clearcoat: 0.22,
      };
    case 'PEDS_Tire_Rubber':
      return { color: '#08090b', roughness: 0.92, metalness: 0.02, clearcoat: 0 };
    default:
      return null;
  }
}

export function applyModelBLivery(root: THREE.Object3D, livery: Parameters<typeof getModelBMaterialTreatment>[1]) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      const treatment = getModelBMaterialTreatment(material.name, livery);
      if (!treatment) continue;
      material.color.set(treatment.color);
      material.roughness = treatment.roughness;
      material.metalness = treatment.metalness;
      if (material instanceof THREE.MeshPhysicalMaterial) {
        material.clearcoat = treatment.clearcoat;
        material.clearcoatRoughness = Math.min(0.42, treatment.roughness * 0.7);
      }
    }
  });
}
