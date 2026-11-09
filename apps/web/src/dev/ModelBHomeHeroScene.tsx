import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as THREE from 'three';
import { readGraphicsMode } from './commercial-b/graphicsPreference';
import { QUALITY_PROFILES } from './commercial-b/qualityProfiles';
import { applyModelBLivery } from './commercial-b/modelBMaterials';
import { getEDSLivery } from '../data/showroom/edsLiveries';

const START = new THREE.Vector3(7.8, 1.8, 0.5);
const TRACK = new THREE.Vector3(5.0, 1.52, -2.25);
const END = new THREE.Vector3(3.6, 1.6, -4.05);
const TARGET = new THREE.Vector3(0, 0.35, 0);
const LIGHT_START = new THREE.Vector3(-5, 4, -5);
const LIGHT_END = new THREE.Vector3(4, 7, -4);
const MOTION_MS = 3000;
const easeSweep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

function CameraMotion({ active, reducedMotion, replayKey, model }: {
  active: boolean;
  reducedMotion: boolean;
  replayKey: number;
  model: THREE.Group;
}) {
  const { camera, invalidate, scene } = useThree();
  const startedAt = useRef<number | null>(null);
  const running = useRef(false);
  const hasPlayed = useRef(false);
  const lastReplayKey = useRef(replayKey);
  const carGroup = useRef<THREE.Group>(null);

  useEffect(() => {
    if (lastReplayKey.current !== replayKey) {
      hasPlayed.current = false;
      lastReplayKey.current = replayKey;
    }
    running.current = active && !reducedMotion && document.visibilityState === 'visible' && !hasPlayed.current;
    startedAt.current = null;
    camera.position.copy(running.current ? START : END);
    camera.lookAt(TARGET);
    if (carGroup.current) {
      carGroup.current.position.set(running.current ? 3.35 : 0, 0, running.current ? 1.35 : 0);
      carGroup.current.rotation.y = running.current ? -0.32 : 0;
    }
    const sweep = scene.getObjectByName('hero-light-sweep') as THREE.DirectionalLight | undefined;
    if (sweep) {
      sweep.position.copy(running.current ? LIGHT_START : LIGHT_END);
      sweep.intensity = running.current ? 2.4 : 4.8;
    }
    invalidate();
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') running.current = false;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      running.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, camera, carGroup, invalidate, reducedMotion, replayKey, scene]);

  useFrame(() => {
    if (!running.current) return;
    hasPlayed.current = true;
    const now = performance.now();
    if (startedAt.current === null) startedAt.current = now;
    const t = Math.min(1, (now - startedAt.current) / MOTION_MS);
    const entry = easeSweep((t - .16) / .31);
    const settle = easeSweep((t - .47) / .53);
    if (t < .47) camera.position.lerpVectors(START, TRACK, entry);
    else camera.position.lerpVectors(TRACK, END, settle);
    camera.lookAt(TARGET);
    if (carGroup.current) {
      carGroup.current.position.set(3.35 * (1 - entry) - .18 * Math.sin(Math.PI * settle), 0, 1.35 * (1 - entry) - .2 * Math.sin(Math.PI * settle));
      carGroup.current.rotation.y = -.32 * (1 - entry) + .16 * Math.sin(Math.PI * settle);
    }
    const sweep = scene.getObjectByName('hero-light-sweep') as THREE.DirectionalLight | undefined;
    if (sweep) {
      sweep.position.lerpVectors(LIGHT_START, LIGHT_END, easeSweep((t - .1) / .68));
      sweep.intensity = 2.4 + 2.4 * easeSweep((t - .1) / .68);
    }
    if (t < 1) invalidate();
    else running.current = false;
  });

  return <group ref={carGroup}><primitive object={model} /></group>;
}

export function ModelBHomeHeroScene({ active, reducedMotion, replayKey, onReady, onError }: {
  active: boolean;
  reducedMotion: boolean;
  replayKey: number;
  onReady: () => void;
  onError: () => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const mode = readGraphicsMode(typeof window === 'undefined' ? null : window.localStorage);
  const profile = QUALITY_PROFILES[mode === 'AUTO' ? 'BALANCED' : mode];

  useEffect(() => {
    const controller = new AbortController();
    let owned: THREE.Group | null = null;
    const load = async () => {
      try {
        const response = await fetch('/__peds-review/model-b.glb', { signal: controller.signal });
        if (!response.ok) throw new Error(`Model B HTTP ${response.status}`);
        const buffer = await response.arrayBuffer();
        await MeshoptDecoder.ready;
        const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, '');
        if (controller.signal.aborted) return;
        owned = gltf.scene;
        owned.rotation.y = Math.PI / 2;
        owned.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(owned);
        const size = bounds.getSize(new THREE.Vector3());
        owned.scale.setScalar(5.05 / Math.max(size.x, size.z));
        owned.updateMatrixWorld(true);
        const scaled = new THREE.Box3().setFromObject(owned);
        const center = scaled.getCenter(new THREE.Vector3());
        owned.position.set(-center.x, -scaled.min.y, -center.z);
        owned.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.material = Array.isArray(object.material)
              ? object.material.map((material) => material.clone())
              : object.material.clone();
          }
        });
        applyModelBLivery(owned, getEDSLivery('eds-carbon'));
        setModel(owned);
      } catch {
        if (!controller.signal.aborted) onError();
      }
    };
    // Defer the request one task so React StrictMode's DEV effect probe does not download the GLB twice.
    const loadTimer = window.setTimeout(() => void load(), 0);
    return () => {
      window.clearTimeout(loadTimer);
      controller.abort();
      if (owned) owned.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [onError]);

  if (!model) return null;
  return (
    <Canvas
      aria-label="Model B Formula 1 2022 Car, local development preview"
      frameloop="demand"
      dpr={profile.renderScale}
      resize={{ offsetSize: true }}
      camera={{ position: [3.6, 1.6, -4.05], fov: 38 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.24;
        gl.setClearColor('#000000', 0);
        onReady();
      }}
    >
      <hemisphereLight args={['#e7edf7', '#242a32', 1.95]} />
      <directionalLight name="hero-light-sweep" position={[4, 7, -4]} intensity={4.8} color="#fff7ee" />
      <directionalLight position={[-4, 4, 5]} intensity={2.8} color="#d9e2ef" />
      <directionalLight position={[0, 2, -6]} intensity={0.9} color="#d20a0a" />
      <CameraMotion active={active} reducedMotion={reducedMotion} replayKey={replayKey} model={model} />
    </Canvas>
  );
}
