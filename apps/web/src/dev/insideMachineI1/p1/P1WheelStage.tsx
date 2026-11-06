import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_URLS, MANIFEST_URL } from '../assetPaths';
import assetIdentity from '../asset-identity.json';
import type { AssemblyManifest, QualityProfile } from '../types';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { pilotFrameAt, positionFromBaseline, centerLockTurnAt, detachmentForScope, type PilotFrame, type WheelInspectionScope } from './pilotMotion';
import { createPilotMaterial, type P1SurfaceMode } from './pilotMaterials';
import { createP1TextureKit } from './P1SurfaceTextures';
import P1EvidenceProbe from './P1EvidenceProbe';
import P1StudioEnvironment from './P1StudioEnvironment';
import P1PartAnnotations from './P1PartAnnotations';
import P1CameraRig from './P1CameraRig';
import P1MacroFocusLight from './P1MacroFocusLight';
import { applyP1BlueprintSurfaces, snapshotP1Surface, type P1SurfaceSnapshot } from './P1BlueprintMaterials';
import { filmLookAt, type P1FilmLook } from './P1FilmDirector';

type LoadedAssets = { model: THREE.Group; manifest: AssemblyManifest };
type Metrics = { drawCalls: number; triangles: number; frameMs: number };
export interface StageProps {
  progress: number;
  selectedPart: string;
  profile: QualityProfile;
  orbit: boolean;
  playing: boolean;
  focusPart: string | null;
  materialMode: P1SurfaceMode;
  scope: WheelInspectionScope;
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

async function verifySourceDigest(bytes: ArrayBuffer, expectedHex: string, label: string) {
  if (!crypto.subtle) throw new Error('Secure-context SHA-256 unavailable for verified 3D source');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toLowerCase();
  if (actual !== expectedHex.toLowerCase()) {
    throw new Error(`P1 source identity mismatch: ${label}. Refusing unverified geometry.`);
  }
}

async function loadAssets(profile: QualityProfile, signal: AbortSignal): Promise<LoadedAssets> {
  const [manifestResponse, modelResponse] = await Promise.all([
    fetch(MANIFEST_URL, { signal, cache: 'no-store' }),
    fetch(ASSET_URLS[profile], { signal, cache: 'no-store' }),
  ]);
  if (!manifestResponse.ok || !modelResponse.ok) {
    throw new Error('Verified R4.5 local assets unavailable; do not substitute a different car.');
  }
  const [manifestBytes, binary] = await Promise.all([
    manifestResponse.arrayBuffer(),
    modelResponse.arrayBuffer(),
  ]);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  if (manifestBytes.byteLength !== assetIdentity.assets.manifest.bytes ||
      binary.byteLength !== assetIdentity.assets[profile].bytes) {
    throw new Error('P1 model source byte-length mismatch. Refusing unverified 3D assets.');
  }
  await Promise.all([
    verifySourceDigest(manifestBytes, assetIdentity.assets.manifest.sha256, 'manifest'),
    verifySourceDigest(binary, assetIdentity.assets[profile].sha256, profile),
  ]);
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as AssemblyManifest;
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

/** Mutate Three.js-owned GPU materials inside the render adapter, not React state. */
function updatePilotOverlayMaterials(items: readonly Overlay[], blueprint: number, selected: string) {
  for (const item of items) {
    const active = item.partId === selected;
    const technicalVisible = blueprint > 0.02;
    // The original source mesh already morphs its PBR colour in Blueprint.
    // A full-opacity second surface would mask genuine source detail.
    item.overlay.visible = technicalVisible;
    item.surface.opacity = technicalVisible ? blueprint * (active ? 0.12 : 0.07) : 0;
    if (item.edges && item.edgeMaterial) {
      item.edges.visible = technicalVisible || active;
      item.edgeMaterial.opacity = technicalVisible
        ? blueprint * (active ? 0.98 : 0.76)
        : (active ? 0.52 : 0);
      item.edgeMaterial.color.copy(active && blueprint < 0.8 ? lineHot : lineBlue);
    }
  }
}

function Vehicle({ model, frame, selected, quality, scope, materialMode }: {
  model: THREE.Group; frame: PilotFrame; selected: string; quality: QualityProfile;
  scope: WheelInspectionScope; materialMode: P1SurfaceMode;
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

  const overlays = useRef<Overlay[]>([]);
  const surfaces = useRef<P1SurfaceSnapshot[]>([]);

  // StrictMode-safe: scene mutations and GPU resource allocations happen in an
  // effect, never inside useMemo or React render.
  useEffect(() => {
    const selectedNodes = new Map(
      FRONT_LEFT_WHEEL_V2.map((part) => [model.getObjectByName(part.node), part.id]),
    );
    const output: Overlay[] = [];
    const assignments: Array<{
      mesh: THREE.Mesh;
      original: THREE.Material | THREE.Material[];
    }> = [];
    const materialCache = new Map<string, { material: THREE.Material; partId: string | null }>();
    const textureKit = createP1TextureKit(quality);
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
      // Every *material* transitions to Blueprint on its original mesh.
      // Only the inspected wheel gets extra feature-edge annotations.
      // Shared original glTF material instances are never mutated.
      const originalMaterial = mesh.material;
      const acquire = (source: THREE.Material): THREE.Material => {
        const hasUV = Boolean(mesh.geometry.getAttribute('uv'));
        const key = `${source.uuid}:${partId ?? 'chassis'}:${hasUV ? 'uv' : 'no-uv'}`;
        const cached = materialCache.get(key);
        if (cached) return cached.material;
        const copy = createPilotMaterial(source, partId, materialMode, textureKit, hasUV);
        materialCache.set(key, { material: copy, partId });
        return copy;
      };
      mesh.material = Array.isArray(originalMaterial)
        ? originalMaterial.map(acquire)
        : acquire(originalMaterial);
      assignments.push({ mesh, original: originalMaterial });

      // Do not add transparent duplicate geometry for all bodywork.
      if (!partId || (scope === 'lock-wheel' && !(
        partId === 'FRONT_LEFT_WHEEL.CENTER_LOCK_NUT' ||
        partId === 'FRONT_LEFT_WHEEL.WHEEL_OUTER'
      ))) continue;

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
      overlay.visible = false;
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
        edges.visible = false;
        mesh.add(edges);
      }
      output.push({ mesh, originalMaterial, overlay, surface, edges, edgeMaterial, edgeGeometry, partId });
    }
    overlays.current = output;
    surfaces.current = [...materialCache.values()].map(({ material, partId }) => snapshotP1Surface(material, partId));
    scene.add(model);
    invalidate();
    return () => {
      scene.remove(model);
      for (const item of output) {
        item.overlay.removeFromParent();
        item.edges?.removeFromParent();
        item.edgeGeometry?.dispose();
        item.edgeMaterial?.dispose();
        item.surface.dispose();

      }
      assignments.forEach(({ mesh, original }) => { mesh.material = original; });
      materialCache.forEach(({ material }) => material.dispose());
      textureKit.dispose();
      overlays.current = [];
      surfaces.current = [];
    };
  }, [model, quality, scope, materialMode, scene, invalidate]);

  const nutAxis = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  const spin = useMemo(() => new THREE.Quaternion(), []);
  const background = useMemo(
    () => backdropDark.clone().lerp(backdropLight, frame.blueprint).getHexString(),
    [frame.blueprint],
  );

  // Invalidate on React state changes; all 3D mutations happen in R3F's
  // renderer-owned frame callback, not in React effects or during render.
  useEffect(() => { invalidate(); }, [frame, invalidate, selected]);
  useFrame(() => {
    original.forEach((item) => {
      const position = positionFromBaseline(item.originalPosition, item.offset, frame.progress, item.order, scope);
      item.object.position.set(...position);
      item.object.quaternion.copy(item.originalQuaternion);
      if (item.order === 0) {
        spin.setFromAxisAngle(nutAxis, Math.PI * 4 * centerLockTurnAt(frame.progress));
        item.object.quaternion.multiply(spin);
      }
    });
    updatePilotOverlayMaterials(overlays.current, frame.blueprint, selected);
    applyP1BlueprintSurfaces(surfaces.current, frame.blueprint);
  });

  return <color attach="background" args={[`#${background}`]} />;
}

/**
 * Story-driven three-point illumination. Changes are continuous, reversible
 * and restrained: warm engineering accent fades as technical blueprint rises.
 * No invented volumetrics, particle glow or false scan-light telemetry.
 */
function CinematicLightRig({
  frame, scope, look,
}: { frame: PilotFrame; scope: WheelInspectionScope; look: P1FilmLook }) {
  const reveal = detachmentForScope(frame.progress, scope);
  return (
    <>
      <ambientLight intensity={look.ambient} />
      <hemisphereLight args={['#d9e9fc', '#405468', look.hemisphere]} />
      <directionalLight
        color="#f5f8ff"
        intensity={look.key + reveal * 0.14}
        position={[5, 9, -7]}
      />
      <directionalLight
        color="#ff906c"
        intensity={look.warmRim}
        position={[-5, 3, 5]}
      />
      <directionalLight
        color="#b3e6ff"
        intensity={look.coolRim}
        position={[-4, 6, -8]}
      />
    </>
  );
}

/** Film exposure follows timeline, never an unrelated animation clock. */
function CinematicExposure({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  // This renderer belongs to the pilot Canvas and is disposed with it.
  // Keep mutable GPU state in R3F's frame loop, outside React effects.
  useFrame(() => {
    gl.toneMappingExposure = exposure;
  });
  return null;
}

function FrameSampler({
  onMetrics, onReady,
}: { onMetrics: (value: Metrics) => void; onReady: (ready: boolean) => void }) {
  const { gl } = useThree();
  const count = useRef(0);
  const lastSample = useRef(0);
  const firstFrameSent = useRef(false);
  useFrame((_, dt) => {
    if (!firstFrameSent.current) {
      firstFrameSent.current = true;
      onReady(true);
    }
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
  progress, selectedPart, profile, orbit, playing, focusPart, materialMode, scope, onError, onReady, onMetrics, onContextLost,
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
  const look = useMemo(() => filmLookAt(progress), [progress]);
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
          <P1StudioEnvironment profile={profile} />
          <CinematicLightRig frame={frame} scope={scope} look={look} />
          <CinematicExposure exposure={look.exposure} />
          <Vehicle model={assets.model} frame={frame} selected={selectedPart} quality={profile} scope={scope} materialMode={materialMode} />
          <P1CameraRig
            frame={frame}
            model={assets.model}
            orbit={orbit}
            focusPart={focusPart}
            playing={playing}
          />
          <P1MacroFocusLight
            model={assets.model}
            focusPart={focusPart}
            profile={profile}
          />
          <P1PartAnnotations
            model={assets.model}
            progress={progress}
            selected={selectedPart}
            focusPart={focusPart}
          />
          {import.meta.env.DEV && (
            <P1EvidenceProbe
              model={assets.model}
              progress={progress}
              selectedPart={selectedPart}
              scope={scope}
              profile={profile}
            />
          )}
          <FrameSampler onMetrics={onMetrics} onReady={onReady} />
          <ContextGuard onContextLost={onContextLost} />
        </Canvas>
      )}
    </div>
  );
}
