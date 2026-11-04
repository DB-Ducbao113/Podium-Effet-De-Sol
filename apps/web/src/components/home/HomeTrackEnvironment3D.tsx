import { useLayoutEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { HomeModelBMode } from './HomeModelBStage';

/**
 * V6.2: original low-poly launch lane, not a replica of an F1 circuit.
 * Model B is normalized to ~5.05 units along Z by prepareModelB().
 * This stage is static and uses a handful of instanced draw calls.
 * No extra renderer, reflection pass, shadows, physics or continuous loop.
 */
type Vector3Tuple = [number, number, number];

const RIB_DEPTHS = [-5.8, -3.6, -1.3, 1.3, 3.6, 5.8];
const FLOOR_DASH_DEPTHS = [-5.6, -4.8, -4, -3.2, -2.4, -1.6, -.8, .8, 1.6, 2.4, 3.2, 4, 4.8, 5.6];
const PIT_STRIPE_DEPTHS = [-5.6, -4.7, -3.8, -2.9, 2.9, 3.8, 4.7, 5.6];

const pillarPositions: Vector3Tuple[] = RIB_DEPTHS.flatMap((z) => [
  [-3.9, 1.48, z] as Vector3Tuple,
  [3.9, 1.48, z] as Vector3Tuple,
]);
const archPositions: Vector3Tuple[] = RIB_DEPTHS.map((z) => [0, 3.04, z] as Vector3Tuple);
const archGlowPositions: Vector3Tuple[] = RIB_DEPTHS.map((z) => [0, 2.92, z] as Vector3Tuple);
const pitLinePositions: Vector3Tuple[] = FLOOR_DASH_DEPTHS.map((z) => [2.64, -.019, z] as Vector3Tuple);
const edgeLightPositions: Vector3Tuple[] = PIT_STRIPE_DEPTHS.flatMap((z) => [
  [-3.19, -.014, z] as Vector3Tuple,
  [3.19, -.014, z] as Vector3Tuple,
]);

function StaticInstances({
  positions,
  dimensions,
  color,
}: {
  positions: Vector3Tuple[];
  dimensions: Vector3Tuple;
  color: string;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const transform = new THREE.Matrix4();
    for (let index = 0; index < positions.length; index++) {
      transform.makeTranslation(...positions[index]);
      mesh.current.setMatrixAt(index, transform);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [positions, invalidate]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]} frustumCulled={false}>
      <boxGeometry args={dimensions} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

export function HomeTrackEnvironment3D({
  mode,
  reducedMotion,
}: {
  mode: HomeModelBMode;
  reducedMotion: boolean;
}) {
  return (
    <group name="peds-v6-launch-corridor" userData={{ environment: 'conceptual', version: 'v6.2' }}>
      {/* Carbon-asphalt base: a real mesh, not an image or expensive reflector. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.11, 0]} receiveShadow={false}>
        <planeGeometry args={[9.1, 15.1]} />
        <meshStandardMaterial color="#101a24" roughness={.79} metalness={.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.09, 0]}>
        <planeGeometry args={[6.4, 13.6]} />
        <meshStandardMaterial color="#192532" roughness={.66} metalness={.22} />
      </mesh>

      {/* Low, dark pit walls frame the car without crossing the camera's center. */}
      <mesh position={[-4.25, .64, 0]}>
        <boxGeometry args={[.16, 1.28, 13.9]} />
        <meshStandardMaterial color="#1a2837" roughness={.72} metalness={.34} />
      </mesh>
      <mesh position={[4.25, .64, 0]}>
        <boxGeometry args={[.16, 1.28, 13.9]} />
        <meshStandardMaterial color="#1a2837" roughness={.72} metalness={.34} />
      </mesh>

      {/* Repeated architecture is GPU-instanced: two pillars per rib, one high crossbar. */}
      <StaticInstances positions={pillarPositions} dimensions={[.095, 2.96, .13]} color="#26394B" />
      <group visible={mode !== 'chassis'}>
        <StaticInstances positions={archPositions} dimensions={[7.95, .085, .13]} color="#284054" />
        <StaticInstances positions={archGlowPositions} dimensions={[7.5, .026, .047]} color="#FF6030" />
      </group>

      {/* Illuminated lateral rails follow the long Z-axis of the car. */}
      <mesh position={[-3.16, .075, 0]}>
        <boxGeometry args={[.035, .025, 13.4]} />
        <meshBasicMaterial color="#FF6236" toneMapped={false} />
      </mesh>
      <mesh position={[3.16, .075, 0]}>
        <boxGeometry args={[.035, .025, 13.4]} />
        <meshBasicMaterial color="#FF6236" toneMapped={false} />
      </mesh>
      <StaticInstances positions={pitLinePositions} dimensions={[.052, .012, .36]} color="#C5D5DD" />
      <StaticInstances positions={edgeLightPositions} dimensions={[.16, .016, .38]} color="#8C3C2C" />

      {/* Subtle backlights: only three lights total, no shadow maps or postprocess. */}
      <pointLight position={[-2.9, 2.5, -3.6]} color="#FF4A18" intensity={reducedMotion ? .6 : 1} distance={7} decay={2} />
      <pointLight position={[2.5, 2.7, 3.5]} color="#5D9FC0" intensity={.75} distance={7} decay={2} />
    </group>
  );
}
