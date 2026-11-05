import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Vector3 } from 'three';
import { CarbonArchitecture, PressureMembrane, VelocityField } from './WorldObjects';
import { limit, mixWorldFrames } from './worldModel';
import type { WorldController, WorldQuality } from './worldModel';

type Props = {
  controller: MutableRefObject<WorldController>;
  quality: Exclude<WorldQuality, 'static'>;
  active: boolean;
  onFailure: () => void;
  onDegrade: () => void;
};

function WorldCamera({ controller }: { controller: MutableRefObject<WorldController> }) {
  const camera = useThree((state) => state.camera);
  const destination = useRef(new Vector3());
  const target = useRef(new Vector3());
  useFrame((_, delta) => {
    const state = controller.current;
    const phase = state.lab ? 0 : state.phase;
    const dx = mixWorldFrames(phase, [0, -.9, .85, .4, -1.2, .1]);
    const dy = mixWorldFrames(phase, [.05, .65, .05, -.3, .35, 0]);
    const dz = mixWorldFrames(phase, [12.1, 12.9, 11.6, 10.9, 13.3, 12.4]);
    destination.current.set(dx + state.pointerX * .24, dy + state.pointerY * .17, dz);
    camera.position.lerp(destination.current, limit(delta * 2.7, 0, 1));
    target.current.set(.55 + Math.sin(phase * .7) * .29, 0, -2.2);
    camera.lookAt(target.current);
  });
  return null;
}

function ContextAndFrameMonitor({ onFailure, onDegrade, quality }: Pick<Props, 'onFailure' | 'onDegrade' | 'quality'>) {
  const gl = useThree((state) => state.gl);
  const readings = useRef({ count: 0, total: 0, degraded: false });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useFrame((_, delta) => {
    if (quality === 'low' || readings.current.degraded) return;
    readings.current.count += 1;
    readings.current.total += delta;
    if (readings.current.count < 240) return;
    const meanFrameSeconds = readings.current.total / readings.current.count;
    readings.current.count = 0;
    readings.current.total = 0;
    if (meanFrameSeconds > .035) {
      readings.current.degraded = true;
      onDegrade();
    }
  });
  return null;
}

function WorldScene({ controller, quality, onFailure, onDegrade }: Omit<Props, 'active'>) {
  const count = quality === 'high' ? 30 : quality === 'balanced' ? 21 : 12;
  return (
    <>
      <ambientLight intensity={.39} color="#9ebdd2" />
      <hemisphereLight args={['#9dc8e1', '#100909', .88]} />
      <directionalLight position={[-3, 5, 6]} intensity={2.4} color="#b0dcf6" />
      <directionalLight position={[6, -1, 4]} intensity={2.3} color="#ff7547" />
      <pointLight position={[3, 1.1, -1.2]} intensity={quality === 'low' ? 6 : 13} distance={16} color="#ff6630" />
      <PressureMembrane controller={controller} />
      <VelocityField controller={controller} count={count} />
      <CarbonArchitecture controller={controller} count={quality === 'low' ? 8 : quality === 'balanced' ? 12 : 16} />
      <WorldCamera controller={controller} />
      <ContextAndFrameMonitor quality={quality} onFailure={onFailure} onDegrade={onDegrade} />
    </>
  );
}

/** Lazy-loaded single context for the V9 world or standalone visual laboratory. */
export default function HomeWorldCanvas({ controller, quality, active, onFailure, onDegrade }: Props) {
  return (
    <Canvas
      className="home-v9-canvas"
      frameloop={active ? 'always' : 'never'}
      dpr={quality === 'high' ? [1, 1.45] : quality === 'balanced' ? [1, 1.18] : [1, 1]}
      camera={{ position: [0, 0, 12.1], near: .1, far: 75, fov: 39 }}
      gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.setClearColor('#060a11', 0); }}
    >
      <Suspense fallback={null}>
        <WorldScene controller={controller} quality={quality} onFailure={onFailure} onDegrade={onDegrade} />
      </Suspense>
    </Canvas>
  );
}
