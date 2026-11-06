import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_URLS, MANIFEST_URL } from '../assetPaths';
import type { AssemblyManifest, QualityProfile } from '../types';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { pilotFrameAt, positionFromBaseline, partDetachmentAt, type PilotFrame } from './pilotMotion';
import { createPilotMaterial } from './pilotMaterials';

type LoadedAssets = { model: THREE.Group; manifest: AssemblyManifest };
type Metrics = { drawCalls: number; triangles: number; frameMs: number };
export interface StageProps {
  progress: number;
  selectedPart: string;
  profile: QualityProfile;
  orbit: boolean;
  onError: (message: string) => void;
  onReady: (loaded: boolean) => void;
  onMetrics: (metrics: Metrics) => void;
  onContextLost: (lost: boolean) => void;
}

function disposeAsset(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

async function loadAssets(profile: QualityProfile, signal: AbortSignal): Promise<LoadedAssets> {
  const [manifestResponse, modelResponse] = await Promise.all([
    fetch(MANIFEST_URL, { signal, cache: 'no-store' }),
    fetch(ASSET_URLS[profile], { signal, cache: 'no-store' }),
  ]);
  if (!manifestResponse.ok || !modelResponse.ok) {
    throw new Error('Verified R4.5 local assets unavailable; do not substitute a different car.');
  }
  const [manifest, binary] = await Promise.all([
    manifestResponse.json() as Promise<AssemblyManifest>,
    modelResponse.arrayBuffer(),
  ]);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const header = new DataView(binary);
  if (binary.byteLength < 20 || header.getUint32(0, true) !== 0x46546c67) {
    throw new Error('Invalid GLB source. Local model identity check required.');
  }
  await MeshoptDecoder.ready;
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.parseAsync(binary, '');
  if (signal.aborted) {
    disposeAsset(gltf.scene);
    throw new DOMException('Aborted', 'AbortError');
  }
  const wheel = manifest.assemblies.find((assembly) => assembly.id === 'FRONT_LEFT_WHEEL');
  const sourceIds = new Set(
    manifest.components
      .filter((part) => part.parentAssemblyId === 'FRONT_LEFT_WHEEL')
      .map((part) => part.id),
  );
  if (
    !wheel ||
    FRONT_LEFT_WHEEL_V2.some(
      (part) => !sourceIds.has(part.id) || !gltf.scene.getObjectByName(part.node),
    )
  ) {
    disposeAsset(gltf.scene);
    throw new Error('Seven-part R4.5 source hierarchy mismatch. Visual pilot blocked.');
  }
  return { model: gltf.scene, manifest };
}

type MotionNode = {
  object: THREE.Object3D;
  originalPosition: readonly [number, number, number];
  originalQuaternion: THREE.Quaternion;
  offset: readonly [number, number, number];
  order: number;
  id: string;
};

type Overlay = {
  mesh: THREE.Mesh;
  originalMaterial: THREE.Material | THREE.Material[];
  pilotMaterial: THREE.Material | THREE.Material[] | null;
  overlay: THREE.Mesh;
  surface: THREE.MeshBasicMaterial;
  edges: THREE.LineSegments | null;
  edgeMaterial: THREE.LineBasicMaterial | null;
  edgeGeometry: THREE.BufferGeometry | null;
  partId: string | null;
};

const backdropDark = new THREE.Color('#080d15');
const backdropLight = new THREE.Color('#eef3f5');
const lineBlue = new THREE.Color('#304a5b');
const lineHot = new THREE.Color('#ff5635');

function Vehicle({ model, frame, selected, quality }: {
  model: THREE.Group; frame: PilotFrame; selected: string; quality: QualityProfile;
}) {
  const { scene, invalidate } = useThree();
  const original = useMemo<MotionNode[]>(() => {
    return FRONT_LEFT_WHEEL_V2.flatMap((part) => {
      const object = model.getObjectByName(part.node);
      if (!object) return [];
      return [{
        object,
        id: part.id,
        originalPosition: [object.position.x, object.position.y, object.position.z],
        originalQuaternion: object.quaternion.clone(),
        offset: part.authoredOffsetZUp,
        order: part.order,
      }];
    });
  }, [model]);

  const overlays = useMemo<Overlay[]>(() => {
    const selectedNodes = new Map(
      FRONT_LEFT_WHEEL_V2.map((part) => [model.getObjectByName(part.node), part.id]),
    );
    const output: Overlay[] = [];
    const allMeshes: THREE.Mesh[] = [];
    model.traverse((item) => {
      if (item instanceof THREE.Mesh) allMeshes.push(item);
    });
    for (const mesh of allMeshes) {
      let cursor: THREE.Object3D | null = mesh;
      let partId: string | null = null;
      while (cursor && cursor !== model) {
        if (selectedNodes.has(cursor)) {
          partId = selectedNodes.get(cursor) ?? null;
          break;
        }
        cursor = cursor.parent;
      }
      const originalMaterial = mesh.material;
      const pilotMaterial = partId
        ? Array.isArray(originalMaterial)
          ? originalMaterial.map((material) => createPilotMaterial(material, partId))
          : createPilotMaterial(originalMaterial, partId)
        : null;
      if (pilotMaterial) mesh.material = pilotMaterial;
      const surface = new THREE.MeshBasicMaterial({
        color: partId ? '#dce6eb' : '#d5e1e8',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const overlay = new THREE.Mesh(mesh.geometry, surface);
      overlay.renderOrder = 2;
      overlay.frustumCulled = mesh.frustumCulled;
      overlay.raycast = () => {};
      mesh.add(overlay);
      let edges: THREE.LineSegments | null = null;
      let edgeMaterial: THREE.LineBasicMaterial | null = null;
      let edgeGeometry: THREE.BufferGeometry | null = null;
      // EdgesGeometry threshold excludes most coplanar triangulation.
      // Restrict lines to the wheel, never draw the full car as a triangle net.
      if (partId && quality !== 'PERFORMANCE') {
        edgeGeometry = new THREE.EdgesGeometry(mesh.geometry, 48);
        edgeMaterial = new THREE.LineBasicMaterial({
          color: lineBlue,
          transparent: true,
          opacity: 0,
          depthTest: true,
          depthWrite: false,
        });
        edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edges.renderOrder = 3;
        mesh.add(edges);
      }
      output.push({ mesh, originalMaterial, pilotMaterial, overlay, surface, edges, edgeMaterial, edgeGeometry, partId });
    }
    return output;
  }, [model, quality]);

  useEffect(() => {
    scene.add(model);
    return () => {
      scene.remove(model);
      for (const item of overlays) {
        item.overlay.removeFromParent();
        item.edges?.removeFromParent();
        item.edgeGeometry?.dispose();
        item.edgeMaterial?.dispose();
        item.surface.dispose();
        if (item.pilotMaterial) {
          item.mesh.material = item.originalMaterial;
          const copies = Array.isArray(item.pilotMaterial) ? item.pilotMaterial : [item.pilotMaterial];
          copies.forEach((material) => material.dispose());
        }
      }
    };
  }, [model, overlays, scene]);

  useEffect(() => {
    original.forEach((item) => {
      const position = positionFromBaseline(item.originalPosition, item.offset, frame.progress, item.order);
      item.object.position.set(...position);
      const phase = partDetachmentAt(frame.progress, item.order);
      item.object.quaternion.copy(item.originalQuaternion);
      if (item.order === 0) {
        // 2 full turns along the negative glTF Z axle of the authored lock.
        const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, -1), Math.PI * 4 * phase);
        item.object.quaternion.multiply(spin);
      }
    });
    for (const item of overlays) {
      item.surface.opacity = frame.blueprint * (item.partId ? 1 : 0.9);
      if (item.edgeMaterial) {
        item.edgeMaterial.opacity = frame.blueprint * 0.92
          + (item.partId === selected ? (1 - frame.blueprint) * 0.55 : 0);
        item.edgeMaterial.color.copy(item.partId === selected && frame.blueprint < 0.8 ? lineHot : lineBlue);
      }
    }
    // Retain exactly the same geometry and transforms during the blueprint morph.
    scene.background = backdropDark.clone().lerp(backdropLight, frame.blueprint);
    invalidate();
  }, [frame, invalidate, original, overlays, scene, selected]);

  return null;
}

function CameraControl({ frame, orbit }: { frame: PilotFrame; orbit: boolean }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    if (orbit) return;
    camera.position.set(...frame.cameraPosition);
    camera.lookAt(...frame.cameraTarget);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, frame, invalidate, orbit]);
  return <OrbitControls enabled={orbit} makeDefault enablePan={false} minDistance={1.2} maxDistance={12} target={[...frame.cameraTarget]} />;
}

function FrameSampler({ onMetrics }: { onMetrics: (value: Metrics) => void }) {
  const { gl } = useThree();
  const count = useRef(0);
  const lastSample = useRef(0);
  useFrame((_, dt) => {
    count.current += 1;
    const now = performance.now();
    if (now - lastSample.current < 900 || count.current < 4) return;
    lastSample.current = now;
    onMetrics({ drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles, frameMs: dt * 1000 });
  });
  return null;
}

function ContextGuard({ onContextLost }: { onContextLost: (lost: boolean) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost(true);
    };
    const restored = () => onContextLost(false);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    return () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, onContextLost]);
  return null;
}

export default function P1WheelStage({
  progress, selectedPart, profile, orbit, onError, onReady, onMetrics, onContextLost,
}: StageProps) {
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let loaded: LoadedAssets | null = null;
    setAssets(null);
    onReady(false);
    loadAssets(profile, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          disposeAsset(result.model);
          return;
        }
        loaded = result;
        setAssets(result);
        onReady(true);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          onError(error instanceof Error ? error.message : 'Unexpected R4.5 load failure');
        }
      });
    return () => {
      controller.abort();
      setAssets(null);
      if (loaded) disposeAsset(loaded.model);
    };
  }, [profile, version, onError, onReady]);

  const frame = useMemo(() => pilotFrameAt(progress), [progress]);
  const dpr: [number, number] = profile === 'HIGH'
    ? [1, 2] : profile === 'BALANCED' ? [1, 1.5] : [0.85, 1];

  return (
    <div className="itm-p1__canvas-frame">
      {!assets && (
        <div className="itm-p1__loading" role="status">
          <strong>R4.5 / MESHOPT SOURCE</strong>
          <span>Verifying and decoding the local engineering model</span>
          <button type="button" onClick={() => setVersion((x) => x + 1)}>Retry</button>
        </div>
      )}
      {assets && (
        <Canvas
          dpr={dpr}
          frameloop="demand"
          camera={{ position: [5, 3, -5], fov: 35, near: 0.02, far: 150 }}
          gl={{ antialias: profile !== 'PERFORMANCE', alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.16;
          }}
        >
          <ambientLight intensity={1.1} />
          <hemisphereLight args={['#d9e9fc', '#405468', 2.2]} />
          <directionalLight color="#f5f8ff" intensity={3.9} position={[5, 9, -7]} />
          <directionalLight color="#ff906c" intensity={2.0} position={[-5, 3, 5]} />
          <directionalLight color="#b3e6ff" intensity={2.6} position={[-4, 6, -8]} />
          <Vehicle model={assets.model} frame={frame} selected={selectedPart} quality={profile} />
          <CameraControl frame={frame} orbit={orbit} />
          <FrameSampler onMetrics={onMetrics} />
          <ContextGuard onContextLost={onContextLost} />
        </Canvas>
      )}
    </div>
  );
}
