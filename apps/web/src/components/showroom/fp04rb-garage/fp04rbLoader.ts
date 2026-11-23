import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import partManifest from './partManifest.json';

export type Fp04rbShowroomLod = 'desktop' | 'mobile';
export type WheelCorner = 'FL' | 'FR' | 'RL' | 'RR';

export const FP04RB_SHOWROOM_URLS: Record<Fp04rbShowroomLod, string> = {
  desktop: '/models/fp04rb-showroom-desktop.glb',
  mobile: '/models/fp04rb-showroom-mobile.glb',
};

export const FP04RB_REQUIRED_NODES = [
  'FP04RB_CAR_ROOT',
  'CAR_CHASSIS_ROOT',
  'PART_FRONT_WING',
  'PART_REAR_WING',
  'DRS_FLAP_PIVOT',
  'PART_FLOOR',
  'PART_SUSPENSION',
  'PART_WINGLETS',
  'PART_COCKPIT',
  'PART_BODY_SHELL',
  'WHEEL_PIVOT_FL',
  'WHEEL_PIVOT_FR',
  'WHEEL_PIVOT_RL',
  'WHEEL_PIVOT_RR',
  'WHEEL_NUT_FL',
  'WHEEL_NUT_FR',
  'WHEEL_NUT_RL',
  'WHEEL_NUT_RR',
  'BRAKE_ASSEMBLY_FL',
  'BRAKE_ASSEMBLY_FR',
  'BRAKE_ASSEMBLY_RL',
  'BRAKE_ASSEMBLY_RR',
] as const;

export const FP04RB_PAINTABLE_SLOTS = [
  'main_body_texture',
  'front_wing_texture',
  'rear_wing_texture',
  'floor_texture',
  'mirrors_texture',
  'winglets_texture',
  'front_suspension_covers_texture',
  'rear_suspension_covers_texture',
] as const;

export const FP04RB_PART_MANIFEST = partManifest;

export interface CachedFp04rbAsset {
  lod: Fp04rbShowroomLod;
  url: string;
  template: THREE.Group;
  bytes: number;
  fetchMs: number;
  decodeParseMs: number;
  triangles: number;
  meshCount: number;
}

export interface CornerNodeHandles {
  corner: WheelCorner;
  wheelPivot: THREE.Object3D | null;
  wheelNut: THREE.Object3D | null;
  brakeAssembly: THREE.Object3D | null;
  initialWheelPos: THREE.Vector3;
  initialNutPos: THREE.Vector3;
  extractSign: 1 | -1;
  extractDistance: number;
}

export interface Fp04rbCarInstance {
  lod: Fp04rbShowroomLod;
  root: THREE.Group;
  chassisRoot: THREE.Object3D | null;
  drsFlapPivot: THREE.Object3D | null;
  partNodes: Record<string, THREE.Object3D | null>;
  corners: Record<WheelCorner, CornerNodeHandles>;
  paintMaterials: Map<string, THREE.MeshStandardMaterial[]>;
  ownedMaterials: THREE.Material[];
  ownedTextures: THREE.Texture[];
  triangles: number;
  meshCount: number;
}

const cachedAssets = new Map<Fp04rbShowroomLod, CachedFp04rbAsset>();
const pendingLoads = new Map<Fp04rbShowroomLod, Promise<CachedFp04rbAsset>>();

export function pickPreferredFp04rbLod(): Fp04rbShowroomLod {
  if (typeof window === 'undefined') return 'desktop';
  const narrow = window.innerWidth <= 768;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return narrow || coarse ? 'mobile' : 'desktop';
}

export function getCachedFp04rbCount(): number {
  return cachedAssets.size;
}

export function getCachedFp04rbAsset(lod: Fp04rbShowroomLod): CachedFp04rbAsset | undefined {
  return cachedAssets.get(lod);
}

function disposeObjectSubtreeMaterialsOnly(
  root: THREE.Object3D,
  includeGeometries: boolean,
  ownedTextures: THREE.Texture[] = [],
): void {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (includeGeometries) obj.geometry.dispose();
    const list = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of list) {
      if (mat && !disposedMaterials.has(mat)) {
        disposedMaterials.add(mat);
        mat.dispose();
      }
    }
  });
  for (const tex of ownedTextures) {
    tex.dispose();
  }
}

export function clearFp04rbCache(): void {
  for (const entry of cachedAssets.values()) {
    disposeObjectSubtreeMaterialsOnly(entry.template, true);
  }
  cachedAssets.clear();
  pendingLoads.clear();
}

function countSceneStats(scene: THREE.Object3D): { triangles: number; meshCount: number } {
  let triangles = 0;
  let meshCount = 0;
  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    meshCount += 1;
    const geo = obj.geometry;
    const indexCount = geo.index ? geo.index.count : geo.attributes.position?.count ?? 0;
    triangles += Math.floor(indexCount / 3);
  });
  return { triangles, meshCount };
}

function validateNormalizedFp04rbHierarchy(scene: THREE.Object3D): void {
  const missing: string[] = [];
  for (const name of FP04RB_REQUIRED_NODES) {
    if (!scene.getObjectByName(name)) missing.push(name);
  }
  if (missing.length > 0) {
    throw new Error(`FP-04 RB Showroom GLB missing required nodes: ${missing.join(', ')}`);
  }
}

export async function loadFp04rbShowroomModel(
  lod: Fp04rbShowroomLod,
  signal?: AbortSignal,
): Promise<CachedFp04rbAsset> {
  if (signal?.aborted) {
    throw new DOMException('FP-04 RB load aborted', 'AbortError');
  }

  const ready = cachedAssets.get(lod);
  if (ready) return ready;

  let inflight = pendingLoads.get(lod);
  if (!inflight) {
    const url = FP04RB_SHOWROOM_URLS[lod];
    inflight = (async () => {
      const fetchStarted = performance.now();
      const response = await fetch(url, {
        cache: import.meta.env.DEV ? 'no-store' : 'default',
      });
      if (!response.ok) {
        throw new Error(`FP-04 RB HTTP ${response.status} loading ${url}`);
      }
      const buffer = await response.arrayBuffer();
      const fetchMs = performance.now() - fetchStarted;

      await MeshoptDecoder.ready;
      const parseStarted = performance.now();
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.parseAsync(buffer, '');
      const decodeParseMs = performance.now() - parseStarted;

      gltf.scene.updateMatrixWorld(true);
      validateNormalizedFp04rbHierarchy(gltf.scene);

      // Preserve P1 Blender coordinate origin (+Y up, +Z nose, y=0 wheel plane),
      // while ensuring any stray residual sub-mm offset rests cleanly at y >= 0.
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      if (Math.abs(bounds.min.y) > 0.0001 && Math.abs(bounds.min.y) < 0.05) {
        gltf.scene.position.y -= bounds.min.y;
        gltf.scene.updateMatrixWorld(true);
      }

      const { triangles, meshCount } = countSceneStats(gltf.scene);
      const asset: CachedFp04rbAsset = {
        lod,
        url,
        template: gltf.scene,
        bytes: buffer.byteLength,
        fetchMs,
        decodeParseMs,
        triangles,
        meshCount,
      };
      cachedAssets.set(lod, asset);
      pendingLoads.delete(lod);
      return asset;
    })().catch((err) => {
      pendingLoads.delete(lod);
      throw err;
    });
    pendingLoads.set(lod, inflight);
  }

  const resolved = await inflight;
  if (signal?.aborted) {
    throw new DOMException('FP-04 RB load aborted', 'AbortError');
  }
  return resolved;
}

const CORNER_CLEARANCES = partManifest.capabilities.wheelRemoval.cornerClearances as Record<
  WheelCorner,
  { extractDistanceMeters: number }
>;

export function cloneFp04rbCarInstance(asset: CachedFp04rbAsset): Fp04rbCarInstance {
  const root = asset.template.clone(true);
  const clonedMaterialMap = new Map<THREE.Material, THREE.Material>();
  const paintMaterials = new Map<string, THREE.MeshStandardMaterial[]>();
  const ownedMaterials: THREE.Material[] = [];

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    const mapOne = (orig: THREE.Material): THREE.Material => {
      let cloned = clonedMaterialMap.get(orig);
      if (!cloned) {
        cloned = orig.clone();
        clonedMaterialMap.set(orig, cloned);
        ownedMaterials.push(cloned);
      }
      if (cloned instanceof THREE.MeshStandardMaterial && orig.name) {
        const bucket = paintMaterials.get(orig.name) ?? [];
        if (!bucket.includes(cloned)) bucket.push(cloned);
        paintMaterials.set(orig.name, bucket);
      }
      return cloned;
    };

    obj.material = Array.isArray(obj.material)
      ? obj.material.map(mapOne)
      : mapOne(obj.material);
  });

  const makeCorner = (corner: WheelCorner, sign: 1 | -1): CornerNodeHandles => {
    const wheelPivot = root.getObjectByName(`WHEEL_PIVOT_${corner}`) ?? null;
    const wheelNut = root.getObjectByName(`WHEEL_NUT_${corner}`) ?? null;
    const brakeAssembly = root.getObjectByName(`BRAKE_ASSEMBLY_${corner}`) ?? null;
    const distance = CORNER_CLEARANCES[corner]?.extractDistanceMeters ?? (corner.startsWith('F') ? 0.42 : 0.52);
    return {
      corner,
      wheelPivot,
      wheelNut,
      brakeAssembly,
      initialWheelPos: wheelPivot ? wheelPivot.position.clone() : new THREE.Vector3(),
      initialNutPos: wheelNut ? wheelNut.position.clone() : new THREE.Vector3(),
      extractSign: sign,
      extractDistance: distance,
    };
  };

  const partNodes: Record<string, THREE.Object3D | null> = {};
  for (const name of FP04RB_REQUIRED_NODES) {
    partNodes[name] = root.getObjectByName(name) ?? null;
  }

  return {
    lod: asset.lod,
    root,
    chassisRoot: root.getObjectByName('CAR_CHASSIS_ROOT') ?? null,
    drsFlapPivot: root.getObjectByName('DRS_FLAP_PIVOT') ?? null,
    partNodes,
    corners: {
      FL: makeCorner('FL', 1),
      FR: makeCorner('FR', -1),
      RL: makeCorner('RL', 1),
      RR: makeCorner('RR', -1),
    },
    paintMaterials,
    ownedMaterials,
    ownedTextures: [],
    triangles: asset.triangles,
    meshCount: asset.meshCount,
  };
}

export function disposeFp04rbInstance(instance: Fp04rbCarInstance): void {
  // Dispose per-instance cloned materials and dynamic canvas textures while keeping shared geometry in template cache
  for (const mat of instance.ownedMaterials) {
    mat.dispose();
  }
  for (const tex of instance.ownedTextures) {
    tex.dispose();
  }
  instance.ownedMaterials.length = 0;
  instance.ownedTextures.length = 0;
  instance.paintMaterials.clear();
}

