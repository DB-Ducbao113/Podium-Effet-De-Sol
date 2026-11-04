import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, TubeGeometry, Vector3 } from 'three';
import type { Group } from 'three';
import type { AeroController } from '../HomeCinematicBackground';
import { clamp } from './aeroMotion';

/**
 * Original sculptural interpretation of the ground-effect principle:
 * wide inlet -> narrow throat -> widening diffuser.
 * Not a real 2026 underfloor, car part, or CFD result.
 */
function venturiGap(u: number): number {
  const throat = Math.exp(-Math.pow((u - 0.45) / 0.21, 2));
  const diffuser = Math.pow(clamp((u - 0.55) / 0.45, 0, 1), 2);
  return 0.32 + 0.76 * (1 - throat) + 0.2 * diffuser;
}

function sampleSurface(u: number, v: number, side: number): Vector3 {
  const gap = venturiGap(u);
  const width = 0.22 + (1 - Math.exp(-Math.pow((u - 0.45) / 0.23, 2))) * 0.2;
  const twist = Math.sin(u * Math.PI * 1.6 + side * 0.6);
  return new Vector3(
    (u - 0.5) * 7.8,
    side * gap + v * width + 0.09 * v * twist,
    -0.34 + v * 0.83 + 0.28 * twist + 0.17 * side,
  );
}

function makeShell(side: number): BufferGeometry {
  const length = 96;
  const width = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= length; i++) {
    const u = i / length;
    for (let j = 0; j <= width; j++) {
      const v = (j / width) * 2 - 1;
      const p = sampleSurface(u, v, side);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, j / width);
    }
  }
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < width; j++) {
      const a = i * (width + 1) + j;
      const b = a + width + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeEdge(side: number, v: number): TubeGeometry {
  const points = Array.from({ length: 29 }, (_, i) => sampleSurface(i / 28, v, side));
  return new TubeGeometry(new CatmullRomCurve3(points), 116, 0.016, 5, false);
}

export function GroundEffectSculpture({ motion }: { motion: MutableRefObject<AeroController> }) {
  const group = useRef<Group>(null);
  const shell = useMemo(() => [makeShell(1), makeShell(-1)], []);
  const edges = useMemo(() => [
    makeEdge(1, 1), makeEdge(1, -1), makeEdge(-1, 1), makeEdge(-1, -1),
  ], []);

  useEffect(() => () => {
    shell.forEach((geometry) => geometry.dispose());
    edges.forEach((geometry) => geometry.dispose());
  }, [shell, edges]);

  useFrame(({ clock }, delta) => {
    const sculpture = group.current;
    if (!sculpture) return;
    const phase = motion.current.phase;
    sculpture.rotation.y += ((-0.19 + phase * 0.105) - sculpture.rotation.y) * clamp(delta * 1.8, 0, 1);
    sculpture.rotation.x += ((-0.08 + Math.sin(clock.elapsedTime * 0.19) * 0.035) - sculpture.rotation.x) * clamp(delta * 1.3, 0, 1);
    sculpture.rotation.z += ((-0.15 + Math.sin(phase * 1.1) * 0.08) - sculpture.rotation.z) * clamp(delta * 1.5, 0, 1);
    sculpture.position.x += ((1.7 + Math.sin(phase * 0.7) * 0.3) - sculpture.position.x) * clamp(delta * 1.8, 0, 1);
    // Final chapter opens the silhouette subtly, rather than spinning an arbitrary object.
    const reveal = clamp((phase - 2.35) / 0.65, 0, 1) * 0.38;
    if (sculpture.children[0]) sculpture.children[0].position.y = reveal;
    if (sculpture.children[1]) sculpture.children[1].position.y = -reveal;
  });

  return (
    <group ref={group} position={[1.7, 0, 0]} rotation={[-0.08, -0.19, -0.15]}>
      {shell.map((geometry, i) => (
        <group key={'shell-' + i}>
          <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
            <meshStandardMaterial
              color={i === 0 ? '#34516a' : '#203448'}
              metalness={0.58}
              roughness={0.29}
              side={DoubleSide}
            />
          </mesh>
          {edges.slice(i * 2, i * 2 + 2).map((edge, j) => (
            <mesh key={'edge-' + j} geometry={edge}>
              <meshBasicMaterial
                color={i === 0 ? '#8bc7dd' : '#fd7945'}
                transparent
                opacity={j === 0 ? 0.54 : 0.23}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
