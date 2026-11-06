import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { QualityProfile } from '../types';

/**
 * P1.4: locally generated studio reflections, no external HDR files.
 *
 * Pure direct lighting leaves metallic brake/hub material nearly black.
 * Three's RoomEnvironment gives broad white studio cards and soft dark
 * reflection bands, closer to the mechanical treatment in the supplied
 * Anime.js reference. This environment is scoped to this Canvas only.
 */
function installStudioReflections(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
): () => void {
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  let texture: THREE.Texture | null = null;
  const previous = scene.environment;

  try {
    texture = generator.fromScene(room, 0.04).texture;
    scene.environment = texture;
  } catch (error) {
    // Direct lights remain functional; failures must not hide the car.
    if (import.meta.env.DEV) {
      console.warn('[P1.4] Studio reflections unavailable:', error);
    }
  } finally {
    room.dispose();
    generator.dispose();
  }

  return () => {
    scene.environment = previous;
    texture?.dispose();
  };
}

export default function P1StudioEnvironment({ profile }: { profile: QualityProfile }) {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    // PMREM environment generation is entirely optional on weaker devices.
    // Direct key/fill/rim lights remain for the PERFORMANCE profile.
    if (profile === 'PERFORMANCE') return;
    const cleanup = installStudioReflections(gl, scene);
    invalidate();
    return () => {
      cleanup();
      invalidate();
    };
  }, [gl, scene, invalidate, profile]);
  return null;
}
