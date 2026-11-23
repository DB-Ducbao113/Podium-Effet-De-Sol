import * as THREE from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export const FP04RB_REVIEW_URL = "/__peds-model-review/fp04rb.glb";
const FP04RB_TRANSMISSION_MATERIALS = new Set([
  "glass_clear_headlight",
  "glass_clear_headlight.001",
  "Translucent Plastic_green",
  "Translucent Plastic_blue",
  "Translucent Plastic_red",
  "Translucent Plastic_yellow",
]);
const FP04RB_GLASS_MATERIALS = new Set([
  "glass_clear_headlight",
  "glass_clear_headlight.001",
]);
const FP04RB_GLASS_OPACITY = 0.18;

export interface Fp04rbAsset {
  gltf: GLTF;
  root: THREE.Group;
  bytes: number;
  triangles: number;
  fetchMs: number;
  decodeParseMs: number;
  prepareMs: number;
}

export async function fetchFp04rbBuffer(
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<ArrayBuffer> {
  const response = await fetcher(FP04RB_REVIEW_URL, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  if (!response.ok)
    throw new Error(`fp04rb review asset HTTP ${response.status}`);
  return response.arrayBuffer();
}

export function prepareFp04rb(root: THREE.Group): THREE.Group {
  root.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  if (size.x > size.z) root.rotation.y = Math.PI / 2;
  root.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(root);
  const orientedSize = bounds.getSize(new THREE.Vector3());
  root.scale.setScalar(5.05 / Math.max(orientedSize.x, orientedSize.z));
  root.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -bounds.min.y, -center.z);
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = false;
      object.receiveShadow = false;
      optimizeFp04rbMaterials(object.material);
    }
  });
  return root;
}

export function optimizeFp04rbMaterials(
  materials: THREE.Material | THREE.Material[],
): number {
  let optimizedCount = 0;
  const materialList = Array.isArray(materials) ? materials : [materials];
  for (const material of materialList) {
    if (!FP04RB_TRANSMISSION_MATERIALS.has(material.name)) continue;
    if (!(material instanceof THREE.MeshPhysicalMaterial)) continue;
    if (material.transmission <= 0) continue;

    material.transmission = 0;
    if (FP04RB_GLASS_MATERIALS.has(material.name)) {
      material.transparent = true;
      material.opacity = FP04RB_GLASS_OPACITY;
      material.depthWrite = false;
    }
    material.needsUpdate = true;
    optimizedCount += 1;
  }
  return optimizedCount;
}

export function getFp04rbCockpitFocus(root: THREE.Object3D): THREE.Vector3 {
  const anchors = ["steering_wheel_body.002", "seat", "seatbelts_harness"]
    .map((name) => getFp04rbMeshAnchor(root, name))
    .filter((anchor): anchor is THREE.Vector3 => anchor !== null);
  if (anchors.length > 0) {
    const focus = new THREE.Vector3();
    for (const anchor of anchors) focus.add(anchor);
    return focus.multiplyScalar(1 / anchors.length);
  }
  const fallback = root.getObjectByName("cockpit_inner") ?? root;
  return new THREE.Box3()
    .setFromObject(fallback)
    .getCenter(new THREE.Vector3());
}

export function getFp04rbCockpitCameraPosition(
  root: THREE.Object3D,
): THREE.Vector3 {
  return getFp04rbCockpitFocus(root).add(new THREE.Vector3(0.7, 1, -1.4));
}

export function getFp04rbMeshAnchor(
  root: THREE.Object3D,
  meshName: string,
): THREE.Vector3 | null {
  const mesh = root.getObjectByName(meshName);
  if (!(mesh instanceof THREE.Mesh) || !mesh.geometry) return null;
  mesh.updateWorldMatrix(true, false);
  const bounds = new THREE.Box3().setFromObject(mesh);
  return bounds.isEmpty() ? null : bounds.getCenter(new THREE.Vector3());
}

export function disposeFp04rb(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of meshMaterials) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
  root.clear();
}

export function countFp04rbTriangles(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry;
    const count =
      geometry.index?.count ?? geometry.getAttribute("position")?.count ?? 0;
    triangles += Math.floor(count / 3);
  });
  return triangles;
}

export async function loadFp04rb(
  signal: AbortSignal,
  dependencies: {
    fetcher?: typeof fetch;
    parse?: (buffer: ArrayBuffer) => Promise<GLTF>;
  } = {},
): Promise<Fp04rbAsset> {
  const fetchStarted = performance.now();
  const buffer = await fetchFp04rbBuffer(signal, dependencies.fetcher);
  const fetchMs = performance.now() - fetchStarted;
  await MeshoptDecoder.ready;
  const parseStarted = performance.now();
  const gltf = dependencies.parse
    ? await dependencies.parse(buffer)
    : await new GLTFLoader()
        .setMeshoptDecoder(MeshoptDecoder)
        .parseAsync(buffer, "");
  if (signal.aborted) {
    disposeFp04rb(gltf.scene);
    throw new DOMException("fp04rb load cancelled", "AbortError");
  }
  const decodeParseMs = performance.now() - parseStarted;
  const prepareStarted = performance.now();
  const root = prepareFp04rb(gltf.scene);
  const prepareMs = performance.now() - prepareStarted;
  if (signal.aborted) {
    disposeFp04rb(root);
    throw new DOMException("fp04rb load cancelled", "AbortError");
  }
  return {
    gltf,
    root,
    bytes: buffer.byteLength,
    triangles: countFp04rbTriangles(root),
    fetchMs,
    decodeParseMs,
    prepareMs,
  };
}
