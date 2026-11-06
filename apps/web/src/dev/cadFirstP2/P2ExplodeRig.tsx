import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { p2MotionFactor } from './P2MotionGroups';
import { P2_KINGPIN, P2_TIE_OUTER, P2_RACK_REST, p2SteeringMate, p2SteeringRigidGroup } from './P2SteeringMate';

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
  model, progress, wheelAngleDeg = 0, steerAngleDeg = 0,
}: { model: THREE.Group; progress: number; wheelAngleDeg?: number; steerAngleDeg?: number }) {
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
  useEffect(() => { invalidate(); }, [amount, wheelAngleDeg, steerAngleDeg, invalidate]);
  const axle = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const kingpin = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const pivot = useMemo(() => new THREE.Vector3(...P2_KINGPIN).multiplyScalar(0.001), []);
  const restTie = useMemo(() => new THREE.Vector3(...P2_TIE_OUTER).multiplyScalar(0.001), []);
  const restRack = useMemo(() => new THREE.Vector3(...P2_RACK_REST).multiplyScalar(0.001), []);
  const qSteer = useMemo(() => new THREE.Quaternion(), []);
  const qWheel = useMemo(() => new THREE.Quaternion(), []);
  const qTie = useMemo(() => new THREE.Quaternion(), []);
  const qCompose = useMemo(() => new THREE.Quaternion(), []);
  const translation = useMemo(() => new THREE.Vector3(), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const outer = useMemo(() => new THREE.Vector3(), []);
  const rack = useMemo(() => new THREE.Vector3(), []);
  const oldRod = useMemo(() => new THREE.Vector3().subVectors(restRack, restTie).normalize(), [restRack, restTie]);
  const newRod = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const pose = p2SteeringMate(steerAngleDeg);
    const theta = THREE.MathUtils.degToRad(steerAngleDeg);
    qSteer.setFromAxisAngle(kingpin, theta);
    outer.set(...pose.outerMm).multiplyScalar(0.001);
    rack.set(...pose.rackMm).multiplyScalar(0.001);
    newRod.subVectors(rack, outer).normalize();
    qTie.setFromUnitVectors(oldRod, newRod);
    nodes.forEach(({ node, original, originalRotation, offset, motion }) => {
      const group = p2SteeringRigidGroup(node.name);
      if (group === 'FIXED_LINK') {
        qCompose.identity();
        translation.set(0, 0, 0);
      } else if (group === 'TIE_ROD') {
        qCompose.copy(qTie);
        translation.copy(outer).sub(scratch.copy(restTie).applyQuaternion(qTie));
      } else {
        qWheel.setFromAxisAngle(axle, THREE.MathUtils.degToRad(wheelAngleDeg * motion));
        qCompose.copy(qSteer).multiply(qWheel);
        translation.copy(pivot).sub(scratch.copy(pivot).applyQuaternion(qSteer));
      }
      node.position.copy(original).applyQuaternion(qCompose)
        .add(translation).addScaledVector(offset, amount);
      node.quaternion.copy(qCompose).multiply(originalRotation);
    });
  });
  return null;
}
