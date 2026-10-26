import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export const MODEL_B_REVIEW_URL = "/__peds-review/model-b.glb";

export function disposeModelB(root: THREE.Object3D) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) material.dispose();
  });
}

export function prepareModelB(scene: THREE.Group) {
  const materialClones = new Map<THREE.Material, THREE.Material>();
  scene.rotation.y = Math.PI / 2;
  scene.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  scene.scale.setScalar(5.05 / Math.max(size.x, size.z));
  scene.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  scene.position.set(-center.x, -bounds.min.y, -center.z);
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const cloneMaterial = (material: THREE.Material) => {
      const existing = materialClones.get(material);
      if (existing) return existing;
      const clone = material.clone();
      materialClones.set(material, clone);
      return clone;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map(cloneMaterial)
      : cloneMaterial(object.material);
    object.castShadow = false;
    object.receiveShadow = false;
  });
  scene.updateMatrixWorld(true);
  return scene;
}

export async function loadModelB(signal: AbortSignal) {
  const fetchStarted = performance.now();
  const response = await fetch(MODEL_B_REVIEW_URL, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`Model B HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  const fetchMs = performance.now() - fetchStarted;
  await MeshoptDecoder.ready;
  const parseStarted = performance.now();
  const gltf = await new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parseAsync(buffer, "");
  if (signal.aborted) {
    disposeModelB(gltf.scene);
    throw new DOMException("Model B load cancelled", "AbortError");
  }
  return {
    scene: prepareModelB(gltf.scene),
    fetchMs,
    decodeParseMs: performance.now() - parseStarted,
    bytes: buffer.byteLength,
  };
}
