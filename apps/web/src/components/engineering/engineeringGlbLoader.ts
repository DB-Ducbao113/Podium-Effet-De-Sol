import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface AuthoredMaterialSnapshot {
  readonly baseTransparent: boolean;
  readonly baseOpacity: number;
  readonly baseDepthWrite: boolean;
  readonly baseEmissiveHex: number;
  readonly baseEmissiveIntensity: number;
  readonly hasEmissiveMap: boolean;
}

const SNAPSHOT_KEY = "__pedsAuthoredMaterial";

/**
 * Configures GLTFLoader so embedded GLB bufferView textures decode through
 * HTMLImageElement (TextureLoader, allowed by `img-src 'self' data: blob:`)
 * instead of ImageBitmapLoader's `fetch(blob:...)` (blocked by `connect-src 'self'`).
 *
 * Preserves 100% of Three.js GLTFLoader's native pipeline: EXT_texture_webp,
 * samplers (mag/min/wrap), flipY=false, SRGBColorSpace on color/emissive maps,
 * KHR_texture_transform, KHR_materials_clearcoat, and URL.revokeObjectURL cleanup.
 */
export function configureCspSafeGltfLoader(loader: GLTFLoader): GLTFLoader {
  loader.register((parser) => {
    const htmlImageTextureLoader = new THREE.TextureLoader(
      parser.options.manager,
    );
    if (parser.options.crossOrigin !== undefined) {
      htmlImageTextureLoader.setCrossOrigin(parser.options.crossOrigin);
    }
    if (parser.options.requestHeader !== undefined) {
      htmlImageTextureLoader.setRequestHeader(parser.options.requestHeader);
    }
    parser.textureLoader = htmlImageTextureLoader;
    return { name: "PEDS_CSP_SAFE_TEXTURE_LOADER" };
  });
  return loader;
}

export function snapshotAuthoredMaterialState(
  material: THREE.MeshStandardMaterial,
): AuthoredMaterialSnapshot {
  const existing = material.userData[SNAPSHOT_KEY] as
    AuthoredMaterialSnapshot | undefined;
  if (existing) return existing;

  const snapshot: AuthoredMaterialSnapshot = {
    baseTransparent: Boolean(material.transparent),
    baseOpacity: Number.isFinite(material.opacity) ? material.opacity : 1,
    baseDepthWrite: Boolean(material.depthWrite),
    baseEmissiveHex: material.emissive ? material.emissive.getHex() : 0x000000,
    baseEmissiveIntensity: Number.isFinite(material.emissiveIntensity)
      ? material.emissiveIntensity
      : 0,
    hasEmissiveMap: Boolean(material.emissiveMap),
  };
  material.userData[SNAPSHOT_KEY] = snapshot;
  return snapshot;
}

export function applyMaterialXrayVisibility(
  material: THREE.MeshStandardMaterial,
  xrayCutaway: boolean,
): AuthoredMaterialSnapshot {
  const authored = snapshotAuthoredMaterialState(material);
  const wasTransparent = material.transparent;

  if (xrayCutaway) {
    material.transparent = true;
    material.opacity = Math.min(authored.baseOpacity, 0.16);
    material.depthWrite = false;
  } else {
    material.transparent = authored.baseTransparent;
    material.opacity = authored.baseOpacity;
    material.depthWrite = authored.baseDepthWrite;
  }

  if (material.transparent !== wasTransparent) {
    material.needsUpdate = true;
  }
  return authored;
}

export function disposeThreeSceneResources(
  root: THREE.Object3D,
  extraMaterials: Iterable<THREE.Material> = [],
): { geometries: number; materials: number; textures: number } {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>(extraMaterials);
  const textures = new Set<THREE.Texture>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const mat of mats) {
      if (mat) materials.add(mat);
    }
  });

  for (const mat of materials) {
    for (const value of Object.values(mat)) {
      if (value instanceof THREE.Texture) {
        textures.add(value);
      }
    }
  }

  for (const tex of textures) tex.dispose();
  for (const mat of materials) mat.dispose();
  for (const geo of geometries) geo.dispose();

  return {
    geometries: geometries.size,
    materials: materials.size,
    textures: textures.size,
  };
}
