import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import { F1Car3DModel } from '../showroom/F1Car3DModel';
import { EDSLiveryId } from '../../data/showroom/edsLiveries';
import { useNavigationStore } from '../../store/useNavigationStore';

function ReadySignal({ onReady }: { onReady: () => void }) {
  useGLTF('/models/eds-g01.glb');
  useEffect(() => onReady(), [onReady]);
  return null;
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
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return (
    <Canvas
      aria-label="Interactive original EDS-G01 vehicle"
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.25]}
      camera={{ position: [4.5, 1.8, -4.7], fov: 43 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      className="h-full w-full cursor-grab active:cursor-grabbing"
    >
      <ambientLight intensity={1.55} />
      <directionalLight position={[4, 7, -4]} intensity={3} color="#ffffff" />
      <directionalLight position={[-4, 3, 5]} intensity={1.5} color="#e10600" />
      <Suspense fallback={null}>
        <F1Car3DModel
          activeHotspot={null}
          onSelectHotspot={() => {}}
          lang={lang}
          showHotspots={false}
          edsLiveryId={livery}
        />
        <ReadySignal onReady={onReady} />
        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.65}
          scale={8}
          blur={2}
          far={4}
          frames={1}
          resolution={256}
        />
      </Suspense>
      <OrbitControls
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
