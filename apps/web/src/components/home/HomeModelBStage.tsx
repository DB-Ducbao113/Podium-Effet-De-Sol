import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { applyModelBLivery } from '../../dev/commercial-b/modelBMaterials';
import { MODEL_B_LIVERIES } from '../../dev/commercial-b/modelBExperience';
import { disposeModelB, loadModelB } from '../../dev/commercial-b/modelBLoader';

export type HomeModelBMode = 'aero' | 'chassis' | 'power';

const VIEWS: Record<HomeModelBMode, { position: [number, number, number]; target: [number, number, number] }> = {
  aero: { position: [3.5, 1.6, -4.0], target: [0, .55, -.28] },
  chassis: { position: [1.1, 5.5, .3], target: [0, .35, 0] },
  power: { position: [3.4, 1.75, 4.15], target: [0, .56, .28] },
};

function ModelBCamera({ mode, active, reducedMotion }: {
  mode: HomeModelBMode;
  active: boolean;
  reducedMotion: boolean;
}) {
  const { camera, invalidate } = useThree();
  const desired = useRef(new THREE.Vector3(...VIEWS.aero.position));
  const aim = useRef(new THREE.Vector3(...VIEWS.aero.target));
  const currentAim = useRef(new THREE.Vector3(...VIEWS.aero.target));
  const moving = useRef(false);

  useEffect(() => {
    desired.current.set(...VIEWS[mode].position);
    aim.current.set(...VIEWS[mode].target);
    if (reducedMotion) {
      camera.position.copy(desired.current);
      currentAim.current.copy(aim.current);
      camera.lookAt(currentAim.current);
      moving.current = false;
    } else {
      moving.current = true;
    }
    invalidate();
  }, [mode, camera, invalidate, reducedMotion]);

  useEffect(() => {
    if (active && moving.current) invalidate();
  }, [active, invalidate]);

  useFrame((_, delta) => {
    if (!active || !moving.current) return;
    const smoothing = 1 - Math.exp(-Math.min(delta, .05) * 6);
    camera.position.lerp(desired.current, smoothing);
    currentAim.current.lerp(aim.current, smoothing);
    camera.lookAt(currentAim.current);
    if (camera.position.distanceToSquared(desired.current) < .0003 &&
        currentAim.current.distanceToSquared(aim.current) < .0003) {
      camera.position.copy(desired.current);
      currentAim.current.copy(aim.current);
      camera.lookAt(currentAim.current);
      moving.current = false;
    } else {
      invalidate();
    }
  });
  return null;
}

function ModelBObject({ onReady, onFailure }: { onReady: () => void; onFailure: () => void }) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let owned: THREE.Group | null = null;
    // Deferral avoids a duplicate GLB request in React StrictMode's effect probe.
    const timer = window.setTimeout(() => {
      void loadModelB(controller.signal).then(({ scene }) => {
        if (controller.signal.aborted) {
          disposeModelB(scene);
          return;
        }
        owned = scene;
        applyModelBLivery(scene, MODEL_B_LIVERIES[0]);
        setModel(scene);
        onReady();
      }).catch(() => {
        if (!controller.signal.aborted) onFailure();
      });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (owned) disposeModelB(owned);
    };
  }, [onReady, onFailure]);

  return model ? <primitive object={model} /> : null;
}

export function HomeModelBStage({ mode, active, reducedMotion, lang }: {
  mode: HomeModelBMode;
  active: boolean;
  reducedMotion: boolean;
  lang: 'vi' | 'en';
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);

  if (failed) {
    return (
      <div className="launch-hud__fallback" role="status">
        <strong>MODEL B</strong>
        <span>{lang === 'vi' ? 'Không tải được mô hình 3D' : '3D preview unavailable'}</span>
        <Link to="/showroom">{lang === 'vi' ? 'Mở Showroom' : 'Open Showroom'}</Link>
      </div>
    );
  }

  return (
    <div className="launch-hud__model" data-loaded={ready} aria-label={lang === 'vi' ? 'Mô hình xe Model B thật ở góc nhìn kỹ thuật' : 'Real Model B 3D car in technical camera views'}>
      {!ready && (
        <div className="launch-hud__loading" role="status">
          <span className="launch-hud__loading-ring" aria-hidden="true" />
          <strong>MODEL B</strong>
          <small>{lang === 'vi' ? 'ĐANG KHỞI TẠO 3D' : 'INITIALIZING 3D'}</small>
        </div>
      )}
      <Canvas
        frameloop="demand"
        dpr={[1, 1.35]}
        camera={{ position: [3.5, 1.6, -4.0], fov: 42, near: .05, far: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          gl.setClearColor('#050c15', 0);
        }}
      >
        <hemisphereLight args={['#e6f1ff', '#233242', 2.0]} />
        <directionalLight position={[8, 12, -8]} intensity={4} color="#fff4e9" />
        <directionalLight position={[-7, 6, 8]} intensity={2.5} color="#94b6d5" />
        <directionalLight position={[-2, 3, -5]} intensity={1.4} color="#ff5c31" />
        <gridHelper args={[9, 18, '#31566c', '#162c40']} position={[0, -.035, 0]} />
        <ModelBObject onReady={onReady} onFailure={onFailure} />
        <ModelBCamera mode={mode} active={active} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
