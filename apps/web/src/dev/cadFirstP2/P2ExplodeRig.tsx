import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { p2MotionFactor } from './P2MotionGroups';

/**
 * Editable local study only, not verified racing wheel disassembly order.
 * Distinct source B-Rep solids retain their local origins and are arranged
 * along editorial axes. No geometry, normals or source material is changed.
 */
function explodeOffset(id: string): [number, number, number] {
  if (id.includes('CENTER_LOCK')) return [0, 0, 0.54];
  if (id.includes('CENTER_STUD')) return [0, 0, 0.25];
  if (id.includes('TYRE')) return [0, 0, 0.36];
  if (id.includes('RIM')) return [0, 0, 0.26];
  if (id.includes('BRAKE_ROTOR') || id.includes('ROTOR_MOUNT')) return [0, 0, -0.22];
  if (id.includes('CALIPER') || id.includes('BRAKE_PAD')) return [0, 0.23, -0.07];
  if (id.includes('BEARING')) return [0, 0, -0.30];
  if (id.includes('UPRIGHT')) return [0, 0, -0.43];
  if (id.includes('WISHBONE') || id.includes('TIE_ROD')) return [-0.19, 0, -0.10];
  if (id.includes('HUB')) return [0, 0, -0.11];
  return [0, 0, 0];
}

export default function P2ExplodeRig({
  model, progress, wheelAngleDeg = 0,
}: { model: THREE.Group; progress: number; wheelAngleDeg?: number }) {
  const { invalidate } = useThree();
  const nodes = useMemo(() => {
    const result: { node: THREE.Mesh; original: THREE.Vector3; originalRotation: THREE.Quaternion; offset: THREE.Vector3; motion: number }[] = [];
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        result.push({
          node,
          original: node.position.clone(),
          originalRotation: node.quaternion.clone(),
          offset: new THREE.Vector3(...explodeOffset(node.name)),
          motion: p2MotionFactor(node.name),
        });
      }
    });
    return result;
  }, [model]);
  useEffect(() => {
    invalidate();
    return () => {
      nodes.forEach(({ node, original, originalRotation }) => {
        node.position.copy(original);
        node.quaternion.copy(originalRotation);
      });
      invalidate();
    };
  }, [invalidate, nodes]);
  const amount = THREE.MathUtils.smoothstep(progress, 0, 1);
  useEffect(() => { invalidate(); }, [amount, wheelAngleDeg, invalidate]);
  const axis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const spin = useMemo(() => new THREE.Quaternion(), []);
  useFrame(() => {
    nodes.forEach(({ node, original, originalRotation, offset, motion }) => {
      const rad = THREE.MathUtils.degToRad(wheelAngleDeg * motion);
      // Source meshes store absolute CAD geometry in their own GLB meshes.
      // Rotate about the shared axle in the authored GLB coordinate frame.
      spin.setFromAxisAngle(axis, rad);
      node.position.copy(original).applyQuaternion(spin).addScaledVector(offset, amount);
      node.quaternion.copy(spin).multiply(originalRotation);
    });
  });
  return null;
}
