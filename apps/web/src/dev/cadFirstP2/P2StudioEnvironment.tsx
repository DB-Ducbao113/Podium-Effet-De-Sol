import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type P2DisplayQuality = 'HIGH' | 'BALANCED' | 'PERFORMANCE';

/**
 * Studio illumination for an original CAD assembly; never an asset or surface
 * imported from a commercial F1 model.
 *
 * PMREM/RoomEnvironment is scoped to the film's R3F Canvas. PERFORMANCE
 * renders key + fill without an environment map or PMREM allocation.
 * All GPU allocations are returned on unmount and never reach other routes.
 */
export default function P2StudioEnvironment({ quality }: { quality: P2DisplayQuality }) {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    if (quality === 'PERFORMANCE') return;
    const old = scene.environment;
    const oldIntensity = scene.environmentIntensity;
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    let target: THREE.WebGLRenderTarget | undefined;

    try {
      target = generator.fromScene(room, quality === 'HIGH' ? 0.06 : 0.10);
      scene.environment = target.texture;
      scene.environmentIntensity = quality === 'HIGH' ? 0.90 : 0.68;
      invalidate();
    } finally {
      room.dispose();
      generator.dispose();
    }
    return () => {
      scene.environment = old;
      scene.environmentIntensity = oldIntensity;
      target?.dispose();
      invalidate();
    };
  }, [gl, scene, quality, invalidate]);

  return null;
}
