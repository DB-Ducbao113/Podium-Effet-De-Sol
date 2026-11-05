import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending, CatmullRomCurve3, DoubleSide, ExtrudeGeometry,
  InstancedMesh, MeshPhysicalMaterial, Object3D, ShaderMaterial,
  Shape, TubeGeometry, Vector2, Vector3,
} from 'three';
import { getVisualWeights, limit, smoothWorldValue } from './worldModel';
import type { WorldController } from './worldModel';

type WorldProps = { controller: MutableRefObject<WorldController> };

const membraneVertex = /* glsl */ `
uniform float uTime;
uniform float uWeight;
uniform float uPhase;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vDeform;
varying vec3 vViewNormal;
void main() {
  vUv = uv;
  vec3 p = position;
  float laminar = sin(p.x * 1.43 + p.y * .69 - uTime * .42);
  float shear = sin(p.x * 2.65 - p.y * 1.74 + uTime * .27);
  vec2 center = vec2(uPointer.x * 3.2, uPointer.y * 1.6);
  float pointerPressure = exp(-dot(p.xy-center,p.xy-center) * .22);
  float wake = sin((p.x - uTime * .78) * 4.5) * exp(-abs(p.y) * 1.6);
  float chapterTwist = sin(p.x * .62 + uPhase * 1.08) * cos(p.y * .7);
  p.z += (laminar * .47 + shear * .13 + pointerPressure * (.25 + wake * .18) + chapterTwist * .28) * uWeight;
  p.y += (.13 * sin(p.x * .95 - uTime * .21) + sin(uPhase * .7) * .16) * uWeight;
  vDeform = abs(laminar) * .7 + pointerPressure * .32;
  float dX = (cos(p.x * 1.43 + p.y * .69 - uTime * .42) * .67 +
              cos(p.x * 2.65 - p.y * 1.74 + uTime * .27) * .35) * uWeight;
  float dY = (cos(p.x * 1.43 + p.y * .69 - uTime * .42) * .32 -
              cos(p.x * 2.65 - p.y * 1.74 + uTime * .27) * .22) * uWeight;
  vViewNormal = normalize(normalMatrix * normalize(vec3(-dX, -dY, 1.)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

const membraneFragment = /* glsl */ `
uniform float uTime;
uniform float uWeight;
varying vec2 vUv;
varying float vDeform;
varying vec3 vViewNormal;
void main() {
  float rim = pow(1. - abs(normalize(vViewNormal).z), 1.9);
  float ridges = pow(max(sin(vUv.x * 34. - vUv.y * 12. - uTime * .25), 0.), 7.);
  float farEdge = smoothstep(.02, .18, vUv.x) * (1. - smoothstep(.81, .98, vUv.x));
  float crossEdge = smoothstep(.0, .18, vUv.y) * (1. - smoothstep(.82, 1., vUv.y));
  float alpha = (.045 + rim * .42 + ridges * .14 + vDeform * .14) * farEdge * crossEdge * uWeight;
  vec3 cold = vec3(.20, .63, .82);
  vec3 silver = vec3(.62, .84, .91);
  vec3 warm = vec3(.93, .32, .14);
  vec3 color = mix(cold, silver, smoothstep(.1, .75, vDeform) * .58);
  color = mix(color, warm, smoothstep(.54, .95, vUv.x) * .34);
  gl_FragColor = vec4(color, alpha);
}`;

const filamentVertex = /* glsl */ `
uniform float uTime;
uniform float uWeight;
uniform float uPhase;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  float squeeze = exp(-abs(p.x) * .22);
  float wave = sin(p.x * 2.2 + uTime * 1.05 + p.z * 1.7);
  p.y += (wave * .08 + uPointer.y * .19 * squeeze) * uWeight;
  p.z += (sin(p.x * 1.45 - uTime * .56 + p.y * .94) * .13 + uPointer.x * .24 * squeeze) * uWeight;
  vDepth = p.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

const filamentFragment = /* glsl */ `
uniform float uTime;
uniform float uWeight;
uniform float uPhase;
varying vec2 vUv;
varying float vDepth;
void main() {
  float pulse = pow(max(sin(vUv.x * 48. - uTime * 2.2 + uPhase * .85), 0.), 8.);
  float taper = smoothstep(.01, .13, vUv.x) * (1. - smoothstep(.84, .99, vUv.x));
  float core = pow(1. - abs(vUv.y * 2. - 1.), 2.1);
  vec3 ice = vec3(.17, .64, .88);
  vec3 orange = vec3(1., .31, .11);
  vec3 silver = vec3(.62, .91, 1.);
  vec3 color = mix(ice, orange, smoothstep(.55, .94, vUv.x) * (.44 + .13 * sin(uPhase)));
  color = mix(color, silver, core * .32 + pulse * .18);
  float alpha = taper * (.11 + .40 * core + .32 * pulse) * uWeight;
  alpha *= .76 + clamp(vDepth * .06, -.15, .18);
  gl_FragColor = vec4(color, alpha);
}`;

function useWorldMaterial(
  vertexShader: string,
  fragmentShader: string,
  uniforms: Record<string, { value: number | Vector2 }>,
) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader, fragmentShader, uniforms, transparent: true,
    blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
  }), [vertexShader, fragmentShader, uniforms]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

/** Shallow 3D pressure fabric with localized pointer displacement. */
export function PressureMembrane({ controller }: WorldProps) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uWeight: { value: 1 }, uPhase: { value: 0 },
    uPointer: { value: new Vector2() },
  }), []);
  const material = useWorldMaterial(membraneVertex, membraneFragment, uniforms);
  const materialRef = useRef(material);
  const strength = useRef(0);
  useFrame(({ clock }, delta) => {
    const state = controller.current;
    strength.current = smoothWorldValue(strength.current, getVisualWeights(state.phase, state.lab).pressure, delta);
    materialRef.current.uniforms.uWeight.value = strength.current;
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uPhase.value = state.phase;
    (materialRef.current.uniforms.uPointer.value as Vector2).set(state.pointerX, state.pointerY);
  });
  return (
    <group position={[1.35, .1, -2.7]} rotation={[.08, -.28, -.12]}>
      <mesh material={material} frustumCulled={false}>
        <planeGeometry args={[10.6, 6.0, 70, 45]} />
      </mesh>
      <mesh material={material} position={[.6, -.65, -1.12]} rotation={[.19, .24, -.22]} frustumCulled={false}>
        <planeGeometry args={[8.1, 3.2, 50, 27]} />
      </mesh>
    </group>
  );
}

/** Geometrically deep curved streamlines, not two-dimensional neon lines. */
export function VelocityField({ controller, count }: WorldProps & { count: number }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uWeight: { value: 0 },
    uPhase: { value: 0 }, uPointer: { value: new Vector2() },
  }), []);
  const material = useWorldMaterial(filamentVertex, filamentFragment, uniforms);
  const materialRef = useRef(material);
  const strength = useRef(0);
  const geometries = useMemo(() => Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : (i / (count - 1) - .5) * 2;
    const tier = i % 4;
    const z = -.8 - tier * .32;
    const curve = new CatmullRomCurve3([
      new Vector3(-6.5, t * 2.7, z),
      new Vector3(-4.6, t * 2.15, z + .22),
      new Vector3(-2.1, t * .87, z + .57),
      new Vector3(.15, t * .54, z + .82),
      new Vector3(2.5, t * 1.14, z + .46),
      new Vector3(4.9, t * 2.12, z + .2),
      new Vector3(7.4, t * 2.8, z),
    ]);
    return new TubeGeometry(curve, 100, i % 5 === 0 ? .024 : .011, 5, false);
  }), [count]);
  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);
  useFrame(({ clock }, delta) => {
    const state = controller.current;
    strength.current = smoothWorldValue(strength.current, getVisualWeights(state.phase, state.lab).velocity, delta);
    materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    materialRef.current.uniforms.uWeight.value = strength.current * (1 + limit(state.pointerSpeed, 0, 1) * .4);
    materialRef.current.uniforms.uPhase.value = state.phase;
    (materialRef.current.uniforms.uPointer.value as Vector2).set(state.pointerX, state.pointerY);
  });
  return (
    <group rotation={[-.05, -.2, -.12]} position={[.5, 0, .45]}>
      {geometries.map((geometry, index) => (
        <mesh key={index} material={material} geometry={geometry} frustumCulled={false} />
      ))}
    </group>
  );
}

function makeCarbonFin(): ExtrudeGeometry {
  const foil = new Shape();
  foil.moveTo(-1.45, -.25);
  foil.bezierCurveTo(-.7, -.18, .32, .20, 1.47, .07);
  foil.bezierCurveTo(1.56, .03, 1.50, -.07, 1.37, -.09);
  foil.bezierCurveTo(.1, -.10, -.63, -.30, -1.45, -.25);
  const geometry = new ExtrudeGeometry(foil, {
    steps: 1, depth: .12, bevelEnabled: true, bevelThickness: .035,
    bevelSize: .042, bevelSegments: 2, curveSegments: 16,
  });
  geometry.center();
  return geometry;
}

/** Curved bevelled aerofoils, one instanced draw call; never a box sculpture. */
export function CarbonArchitecture({ controller, count }: WorldProps & { count: number }) {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());
  const shape = useMemo(() => makeCarbonFin(), []);
  const material = useMemo(() => new MeshPhysicalMaterial({
    color: '#233647', metalness: .65, roughness: .25,
    clearcoat: .72, clearcoatRoughness: .25, emissive: '#21100b',
    emissiveIntensity: .1, side: DoubleSide,
  }), []);
  useEffect(() => () => { shape.dispose(); material.dispose(); }, [shape, material]);
  const strength = useRef(0);
  useFrame(({ clock }, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const state = controller.current;
    strength.current = smoothWorldValue(strength.current, getVisualWeights(state.phase, state.lab).carbon, delta);
    const open = strength.current;
    for (let i = 0; i < count; i++) {
      const order = i - (count - 1) / 2;
      const spread = order / Math.max(1, count / 2);
      const phase = state.lab === 'carbon' ? 3.2 : state.phase;
      const spiral = Math.sin((i / count) * Math.PI * 2 + phase * .42);
      dummy.current.position.set(
        1.9 + spiral * .42 + Math.sin(clock.elapsedTime * .21 + i) * .055,
        spread * (1.2 + open * 1.5),
        -3.4 + Math.cos(i * 1.73) * (1.55 + open * .9),
      );
      dummy.current.rotation.set(
        -.09 + spread * .17 + open * .10,
        -.42 + spread * .18 + phase * .045,
        (order * .115 + Math.sin(phase * .44 + i * .22) * .19) * open,
      );
      const size = .85 + .13 * Math.sin(i * 1.39);
      dummy.current.scale.set(size * (.65 + open * .55), size * .95, size * (.7 + open * .45));
      dummy.current.updateMatrix();
      mesh.setMatrixAt(i, dummy.current.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh
    ref={ref}
    args={[shape, material, count]}
    frustumCulled={false}
    castShadow={false}
    receiveShadow={false}
  />;
}
