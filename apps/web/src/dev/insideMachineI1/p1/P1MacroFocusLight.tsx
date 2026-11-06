import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import type { QualityProfile } from '../types';

const LIGHT_OFFSET = new THREE.Vector3(0.35, 0.55, -0.45);

/**
 * Very restrained neutral catchlight for close mechanical inspection.
 * Only enables for the active semantic part and never casts shadows.
 * PERFORMANCE omits the extra dynamic light entirely.
 */
export default function P1MacroFocusLight({
  model,
  focusPart,
  profile,
}: {
  model: THREE.Group;
  focusPart: string | null;
  profile: QualityProfile;
}) {
  const light = useRef<THREE.PointLight>(null);
  const bounds = useMemo(() => new THREE.Box3(), []);
  const center = useMemo(() => new THREE.Vector3(), []);
  const source = FRONT_LEFT_WHEEL_V2.find((part) => part.id === focusPart);
  const node = source ? model.getObjectByName(source.node) : null;

  useFrame(() => {
    if (!light.current) return;
    if (!node || profile === 'PERFORMANCE') {
      light.current.intensity = 0;
      return;
    }
    node.updateWorldMatrix(true, true);
    bounds.setFromObject(node, true);
    if (bounds.isEmpty()) {
      node.getWorldPosition(center);
    } else {
      bounds.getCenter(center);
    }
    light.current.position.copy(center).add(LIGHT_OFFSET);
    light.current.intensity = 1.15;
  });

  if (profile === 'PERFORMANCE') return null;
  return (
    <pointLight
      ref={light}
      color="#f3f8ff"
      intensity={0}
      distance={2.8}
      decay={2}
      castShadow={false}
    />
  );
}
