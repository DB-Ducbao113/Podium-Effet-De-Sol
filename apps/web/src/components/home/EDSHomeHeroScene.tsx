import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { F1Car3DModel } from '../showroom/F1Car3DModel';
import { EDSLiveryId } from '../../data/showroom/edsLiveries';
import { useNavigationStore } from '../../store/useNavigationStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function G01ReadySignal({ onReady }: { onReady: () => void }) {
  useGLTF('/models/eds-g01.glb');
  useEffect(() => onReady(), [onReady]);
  return null;
}

function DevModelBCar({
  liveryId,
  onReady,
  onError,
}: {
  liveryId: EDSLiveryId;
  onReady: () => void;
  onError: () => void;
}) {
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let loadedGroup: THREE.Group | null = null;

    async function load() {
      try {
        const { loadModelB, disposeModelB } = await import('../../dev/commercial-b/modelBLoader');
        const { applyModelBLivery } = await import('../../dev/commercial-b/modelBMaterials');
        const { getEDSLivery } = await import('../../data/showroom/edsLiveries');

        const { scene } = await loadModelB(controller.signal);
        if (controller.signal.aborted) return;
        loadedGroup = scene;

        applyModelBLivery(scene, getEDSLivery(liveryId));
        setModelScene(scene);
        onReady();
      } catch (err) {
        if (!controller.signal.aborted) {
          console.warn('[EDSHomeHeroScene] Model B DEV load error, falling back to EDS-G01:', err);
          onError();
        }
      }
    }

    const timer = window.setTimeout(load, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      if (loadedGroup) {
        import('../../dev/commercial-b/modelBLoader').then(({ disposeModelB }) => {
          if (loadedGroup) disposeModelB(loadedGroup);
        });
      }
    };
  }, [liveryId, onReady, onError]);

  if (!modelScene) return null;
  return <primitive object={modelScene} />;
}

export function EDSHomeHeroScene({
  livery,
  onReady,
  active,
}: {
  livery: EDSLiveryId;
  onReady: () => void;
  active: boolean;
}) {
  const lang = useNavigationStore((state) => state.lang);
  const reduceMotion = useReducedMotion();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [modelBFatal, setModelBFatal] = useState(false);
  const useModelB = import.meta.env.DEV && !modelBFatal;

  const handleKeyboardInspect: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const angularStep = Math.PI / 18;
    switch (event.key) {
      case 'ArrowLeft':
        controls.setAzimuthalAngle(controls.getAzimuthalAngle() + angularStep);
        break;
      case 'ArrowRight':
        controls.setAzimuthalAngle(controls.getAzimuthalAngle() - angularStep);
        break;
      case 'ArrowUp':
        controls.setPolarAngle(Math.max(1.05, controls.getPolarAngle() - angularStep));
        break;
      case 'ArrowDown':
        controls.setPolarAngle(Math.min(1.7, controls.getPolarAngle() + angularStep));
        break;
      default:
        return;
    }

    event.preventDefault();
    controls.update();
  };

  return (
    <Canvas
      aria-label={
        useModelB
          ? lang === 'vi'
            ? 'Mẫu xe Model B Optimized tương tác. Dùng các phím mũi tên để xoay góc nhìn.'
            : 'Interactive Model B Optimized vehicle. Use the arrow keys to rotate the view.'
          : lang === 'vi'
            ? 'Mẫu xe EDS-G01 tương tác. Dùng các phím mũi tên để xoay góc nhìn.'
            : 'Interactive EDS-G01 vehicle. Use the arrow keys to rotate the view.'
      }
      role="application"
      tabIndex={0}
      onKeyDown={handleKeyboardInspect}
      frameloop={active && !reduceMotion ? 'always' : 'demand'}
      dpr={[1, 1.25]}
      camera={{ position: [4.5, 1.8, -4.7], fov: 43 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.28;
      }}
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      <ambientLight intensity={2.05} />
      <hemisphereLight args={['#f3f6ff', '#11141b', 1.4]} />
      <directionalLight position={[4, 7, -4]} intensity={4.2} color="#ffffff" />
      <directionalLight position={[-4, 4, 5]} intensity={2.3} color="#d9e2ef" />
      <directionalLight position={[0, 2, -6]} intensity={1.25} color="#d20a0a" />
      <Suspense fallback={null}>
        {useModelB ? (
          <DevModelBCar
            liveryId={livery}
            onReady={onReady}
            onError={() => setModelBFatal(true)}
          />
        ) : (
          <>
            <F1Car3DModel
              activeHotspot={null}
              onSelectHotspot={() => {}}
              lang={lang}
              showHotspots={false}
              edsLiveryId={livery}
            />
            <G01ReadySignal onReady={onReady} />
          </>
        )}
        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.5}
          scale={8}
          blur={2}
          far={4}
          frames={1}
          resolution={256}
        />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={1.05}
        maxPolarAngle={1.7}
        autoRotate={active && !reduceMotion}
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
