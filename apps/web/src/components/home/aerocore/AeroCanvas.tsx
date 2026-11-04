import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { AdditiveBlending, CatmullRomCurve3, DoubleSide, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import type { Group } from 'three';
import type { AeroController } from '../HomeCinematicBackground';
import { clamp, getAeroEnergy } from './aeroMotion';

type Props = { controller: MutableRefObject<AeroController>; visible: boolean; onFailure: () => void };

const vertexShader = [
  'varying vec2 vUv;',
  'uniform float uTime;',
  'uniform float uEnergy;',
  'void main() {',
  '  vUv = uv;',
  '  vec3 p = position + normal * (0.028 * uEnergy * sin(uv.x * 38.0 - uTime * 1.3));',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '}',
].join('\n');

const fragmentShader = [
  'varying vec2 vUv;',
  'uniform float uTime;',
  'uniform float uEnergy;',
  'uniform float uPhase;',
  'void main() {',
  '  float heat = smoothstep(-0.65, 0.9, sin(vUv.x * 18.0 - uTime * 1.65 + uPhase));',
  '  vec3 cold = vec3(0.11, 0.68, 0.91);',
  '  vec3 hot = vec3(1.0, 0.24, 0.075);',
  '  vec3 color = mix(cold, hot, heat * (0.66 + 0.2 * uEnergy));',
  '  float taper = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));',
  '  float highlight = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0);',
  '  gl_FragColor = vec4(color * (0.55 + highlight * 0.8), taper * (0.26 + highlight * 0.42));',
  '}',
].join('\n');

function Airflow({ motion }: { motion: MutableRefObject<AeroController> }) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
    side: DoubleSide, blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uEnergy: { value: 0.7 }, uPhase: { value: 0 } },
  }), []);
  const materialRef = useRef(material);
  const geometries = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const shift = ((i % 6) - 2.5) * .44;
    const back = Math.floor(i / 6);
    return new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-6, shift - .8, -1.3 - back),
      new Vector3(-3.3, shift + .65, -1 - back * .7),
      new Vector3(-1.25, shift - .45, -back * .3),
      new Vector3(1.1, shift + .45, .4 - back * .7),
      new Vector3(3.1, shift - .9, -.5 - back * .6),
      new Vector3(6, shift + .5, -2 - back),
    ]), 100, back ? .017 : .027, 5, false);
  }), []);
  useEffect(() => () => { material.dispose(); geometries.forEach((g) => g.dispose()); }, [geometries, material]);
  useFrame(({ clock }, delta) => {
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uPhase.value = motion.current.phase;
    materialRef.current.uniforms.uEnergy.value += (getAeroEnergy(motion.current.phase) - materialRef.current.uniforms.uEnergy.value) * clamp(delta * 3, 0, 1);
  });
  return <group rotation={[.05, -.12, -.08]}>
    {geometries.map((geometry, index) =>
      <mesh key={index} geometry={geometry} material={material} frustumCulled={false} />)}
  </group>;
}

function CarbonCore({ motion }: { motion: MutableRefObject<AeroController> }) {
  const group = useRef<Group>(null);
  const phase = useRef(0);
  useFrame(({ clock }, delta) => {
    phase.current += (motion.current.phase - phase.current) * clamp(delta * 2.2, 0, 1);
    const g = group.current;
    if (!g) return;
    g.rotation.y = -.38 + phase.current * .39 + Math.sin(clock.elapsedTime * .15) * .045;
    g.rotation.x = .18 + phase.current * .08;
    g.rotation.z = -.18 + Math.sin(clock.elapsedTime * .13) * .05;
    g.position.x = 1.35 + Math.sin(phase.current * 1.2) * .7;
    const spread = clamp(phase.current - 2.45, 0, .55) * 1.5;
    g.children.forEach((child, index) => {
      if (index > 0 && index < 6) child.position.z = (index - 3) * (.22 + spread);
    });
  });
  return <group ref={group} position={[1.35, 0, 0]}>
    <mesh rotation={[.1, .3, 0]}>
      <icosahedronGeometry args={[1.48, 1]} />
      <meshStandardMaterial color="#172431" metalness={.84} roughness={.28} flatShading />
    </mesh>
    {Array.from({ length: 5 }, (_, i) =>
      <mesh key={i} rotation={[.15 + i * .12, .12 + i * .52, .35 + i * .62]} position={[0, 0, (i - 2) * .22]}>
        <boxGeometry args={[3.25 - i * .22, .14 + (i % 2) * .11, 1.26]} />
        <meshStandardMaterial color={i % 2 === 0 ? '#314052' : '#1c2b39'} metalness={.88} roughness={.28} />
      </mesh>)}
    <mesh rotation={[.18, .44, 0]}>
      <torusGeometry args={[2.05, .045, 8, 90]} />
      <meshStandardMaterial color="#91b9ce" emissive="#215775" emissiveIntensity={.32} metalness={.9} roughness={.2} />
    </mesh>
    <mesh rotation={[.5, 1.1, 0]}>
      <torusGeometry args={[2.32, .025, 8, 90]} />
      <meshBasicMaterial color="#ff632e" transparent opacity={.55} />
    </mesh>
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
    <ambientLight intensity={.65} />
    <directionalLight position={[3, 4, 6]} intensity={2.3} color="#a3dafa" />
    <pointLight position={[0, -2, 4]} intensity={45} distance={12} color="#ff5b29" />
    <pointLight position={[-4, 3, 0]} intensity={24} distance={11} color="#319bc7" />
    <CarbonCore motion={controller} />
    <Airflow motion={controller} />
    <CameraRig motion={controller} />
  </>;
}

/** WebGL-only dynamic chunk; never statically import into the Home shell. */
export function AeroCanvas({ controller, visible, onFailure }: Props) {
  return <Canvas
    className="home-aerocore__canvas"
    dpr={[1, 1.5]}
    frameloop={visible ? 'always' : 'never'}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    camera={{ position: [0, .5, 10.5], fov: 39, near: .1, far: 90 }}
  >
    <AeroWorld controller={controller} onFailure={onFailure} />
  </Canvas>;
}
