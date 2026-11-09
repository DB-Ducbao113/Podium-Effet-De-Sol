import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { AdditiveBlending, CatmullRomCurve3, DoubleSide, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import { GroundEffectSculpture } from './GroundEffectSculpture';
import type { AeroController } from '../HomeCinematicBackground';
import { clamp, getAeroEnergy } from './aeroMotion';

type Props = { controller: MutableRefObject<AeroController>; visible: boolean; onFailure: () => void };

const vertexShader = [
  'varying vec2 vUv;',
  'uniform float uTime;',
  'void main() {',
  '  vUv = uv;',
  '  vec3 p = position + normal * (0.012 * sin(uv.x * 21.0 - uTime * 1.1));',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '}',
].join('\n');

const fragmentShader = [
  'varying vec2 vUv;',
  'uniform float uTime;',
  'uniform float uEnergy;',
  'uniform float uPhase;',
  'void main() {',
  '  float throat = smoothstep(0.23, 0.42, vUv.x) * (1.0 - smoothstep(0.54, 0.78, vUv.x));',
  '  vec3 inlet = vec3(0.19, 0.74, 0.91);',
  '  vec3 compression = vec3(1.0, 0.34, 0.13);',
  '  vec3 release = vec3(0.5, 0.83, 1.0);',
  '  vec3 color = mix(inlet, compression, throat * (0.64 + uEnergy * 0.22));',
  '  color = mix(color, release, smoothstep(0.69, 0.98, vUv.x) * 0.45);',
  '  float movingHighlight = pow(max(sin(vUv.x * 31.0 - uTime * 2.2 + uPhase), 0.0), 8.0);',
  '  float taper = smoothstep(0.0, 0.13, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));',
  '  float core = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.8);',
  '  float alpha = taper * (0.19 + core * 0.41) * (0.85 + throat * 0.15);',
  '  gl_FragColor = vec4(color * (0.65 + core * 0.6 + movingHighlight * 0.32), alpha);',
  '}',
].join('\n');

function Airflow({ motion }: { motion: MutableRefObject<AeroController> }) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
    side: DoubleSide, blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: 0.7 }, uPhase: { value: 0 } },
  }), []);
  const materialRef = useRef(material);
  // Laminar streamlines converge at the venturi throat, then expand in the diffuser.
  const geometries = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const line = (i - 7.5) / 7.5;
    const depth = i % 3;
    return new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-5.25, line * 1.38, 1.22 - depth * 0.22),
      new Vector3(-3.65, line * 1.05, 1.37 - depth * 0.19),
      new Vector3(-1.45, line * 0.39, 1.56 - depth * 0.12),
      new Vector3(0.0, line * 0.27, 1.65 - depth * 0.12),
      new Vector3(1.45, line * 0.59, 1.58 - depth * 0.19),
      new Vector3(3.4, line * 1.04, 1.33 - depth * 0.21),
      new Vector3(5.6, line * 1.43, 1.12 - depth * 0.24),
    ]), 128, i % 4 === 0 ? 0.023 : 0.013, 5, false);
  }), []);
  useEffect(() => () => { material.dispose(); geometries.forEach((g) => g.dispose()); }, [geometries, material]);
  useFrame(({ clock }, delta) => {
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uPhase.value = motion.current.phase;
    materialRef.current.uniforms.uEnergy.value += (getAeroEnergy(motion.current.phase) - materialRef.current.uniforms.uEnergy.value) * clamp(delta * 3, 0, 1);
  });
  return <group position={[1.7, 0, 0]} rotation={[-.08, -.19, -.15]}>
    {geometries.map((geometry, index) =>
      <mesh key={index} geometry={geometry} material={material} frustumCulled={false} />)}
  </group>;
}

function CameraRig({ motion }: { motion: MutableRefObject<AeroController> }) {
  const { camera } = useThree();
  const destination = useRef(new Vector3());
  const target = useRef(new Vector3());
  useFrame((_, delta) => {
    const p = motion.current.phase;
    destination.current.set(
      Math.sin(p * .45) * 1.1 + motion.current.pointerX * .18,
      .6 - p * .2 - motion.current.pointerY * .13,
      10.4 + Math.sin(p * 1.5) * 1.25,
    );
    camera.position.lerp(destination.current, clamp(delta * 2.6, 0, 1));
    target.current.set(.8 + Math.sin(p) * .35, 0, 0);
    camera.lookAt(target.current);
  });
  return null;
}

function AeroWorld({ controller, onFailure }: Pick<Props, 'controller' | 'onFailure'>) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const element = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    element.addEventListener('webglcontextlost', lost);
    return () => element.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return <>
    <hemisphereLight args={['#a8d3ef', '#160d13', 1.15]} />
    <directionalLight position={[2, 5, 7]} intensity={3.4} color="#d9edff" />
    <directionalLight position={[-5, -2, 2]} intensity={2.2} color="#fb784d" />
    <pointLight position={[3, -0.6, 3.5]} intensity={22} distance={12} color="#ff6a35" />
    <pointLight position={[-2, 2.2, 4]} intensity={17} distance={13} color="#59c2ea" />
    <GroundEffectSculpture motion={controller} />
    <Airflow motion={controller} />
    <CameraRig motion={controller} />
  </>;
}

/** WebGL-only dynamic chunk; never statically import into the Home shell. */
export function AeroCanvas({ controller, visible, onFailure }: Props) {
  return <Canvas
    className="home-aerocore__canvas"
    dpr={[1, 1.5]}
    resize={{ offsetSize: true }}
    frameloop={visible ? 'always' : 'never'}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    camera={{ position: [0, .5, 10.5], fov: 39, near: .1, far: 90 }}
  >
    <AeroWorld controller={controller} onFailure={onFailure} />
  </Canvas>;
}
