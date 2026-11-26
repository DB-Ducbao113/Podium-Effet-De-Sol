import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { consumePrefetchedGlbArrayBuffer } from "../storm/modelPrefetchCache";

export interface AuthoredMaterialSnapshot {
  readonly baseTransparent: boolean;
  readonly baseOpacity: number;
  readonly baseDepthWrite: boolean;
  readonly baseEmissiveHex: number;
  readonly baseEmissiveIntensity: number;
  readonly hasEmissiveMap: boolean;
}

export interface CachedEngineeringGlbAsset {
  readonly url: string;
  readonly template: THREE.Group;
  readonly bytes: number;
}

const SNAPSHOT_KEY = "__pedsAuthoredMaterial";

const cachedEngineeringAssets = new Map<string, CachedEngineeringGlbAsset>();
const pendingEngineeringLoads = new Map<
  string,
  Promise<CachedEngineeringGlbAsset>
>();

export function getCachedEngineeringGlbAsset(
  url: string,
): CachedEngineeringGlbAsset | undefined {
  return cachedEngineeringAssets.get(url);
}

export function getCachedEngineeringGlbCount(): number {
  return cachedEngineeringAssets.size;
}

export function clearEngineeringGlbCache(): void {
  for (const entry of cachedEngineeringAssets.values()) {
    disposeThreeSceneResources(entry.template);
  }
  cachedEngineeringAssets.clear();
  pendingEngineeringLoads.clear();
}

/**
 * Preserves authored backface culling (`FrontSide`) on closed internal/mechanical
 * assemblies while enabling `DoubleSide` on thin outer aerodynamic shells (whose
 * interior faces become visible during cutaway/disassembly) or materials explicitly
 * authored as double-sided in the GLB.
 */
export function resolveEngineeringMaterialSide(
  outerShell: boolean,
  authoredSide: THREE.Side,
): THREE.Side {
  if (outerShell || authoredSide === THREE.DoubleSide) {
    return THREE.DoubleSide;
  }
  return authoredSide;
}

export async function loadEngineeringGlbTemplate(
  url: string,
  options?: {
    signal?: AbortSignal;
    onDownloadProgress?: (loadedBytes: number, totalBytes: number) => void;
    onPhase?: (phase: "init" | "parsing" | "ready") => void;
  },
): Promise<CachedEngineeringGlbAsset> {
  if (options?.signal?.aborted) {
    throw new DOMException("Engineering GLB load aborted", "AbortError");
  }

  const cached = cachedEngineeringAssets.get(url);
  if (cached) {
    options?.onPhase?.("ready");
    return cached;
  }

  let inflight = pendingEngineeringLoads.get(url);
  if (!inflight) {
    inflight = (async () => {
      options?.onPhase?.("init");
      let arrayBuffer: ArrayBuffer;
      const prefetched = consumePrefetchedGlbArrayBuffer(url);
      if (prefetched) {
        arrayBuffer = await prefetched;
        options?.onDownloadProgress?.(
          arrayBuffer.byteLength,
          arrayBuffer.byteLength,
        );
      } else {
        const res = await fetch(url, {
          credentials: "same-origin",
          cache: import.meta.env?.DEV ? "no-store" : "default",
        });
        if (!res.ok) {
          throw new Error(`Model HTTP ${res.status}`);
        }
        const totalBytes = Number(res.headers.get("content-length")) || 0;
        if (res.body && typeof res.body.getReader === "function") {
          const reader = res.body.getReader();
          const chunks: Uint8Array[] = [];
          let loadedBytes = 0;
          let lastEmitMs = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              loadedBytes += value.byteLength;
              const nowMs = performance.now();
              if (nowMs - lastEmitMs >= 48 || loadedBytes >= totalBytes) {
                lastEmitMs = nowMs;
                options?.onDownloadProgress?.(loadedBytes, totalBytes);
              }
            }
          }
          const combined = new Uint8Array(loadedBytes);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
          }
          arrayBuffer = combined.buffer;
        } else {
          options?.onDownloadProgress?.(1, 2);
          arrayBuffer = await res.arrayBuffer();
        }
      }

      options?.onPhase?.("parsing");
      await MeshoptDecoder.ready;
      const loader = configureCspSafeGltfLoader(
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),
      );
      const gltf = await loader.parseAsync(arrayBuffer, "");
      gltf.scene.updateWorldMatrix(true, true);

      const asset: CachedEngineeringGlbAsset = {
        url,
        template: gltf.scene,
        bytes: arrayBuffer.byteLength,
      };
      cachedEngineeringAssets.set(url, asset);
      pendingEngineeringLoads.delete(url);
      return asset;
    })().catch((err) => {
      pendingEngineeringLoads.delete(url);
      throw err;
    });
    pendingEngineeringLoads.set(url, inflight);
  }

  const resolved = await inflight;
  if (options?.signal?.aborted) {
    throw new DOMException("Engineering GLB load aborted", "AbortError");
  }
  return resolved;
}

/**
 * Disposes only per-instance cloned materials so shared template geometries and
 * textures remain warm in the module cache across route revisits.
 */
export function disposeEngineeringInstanceMaterials(
  materials: Iterable<THREE.Material>,
): number {
  const unique = new Set<THREE.Material>(materials);
  for (const mat of unique) {
    mat.dispose();
  }
  return unique.size;
}

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
