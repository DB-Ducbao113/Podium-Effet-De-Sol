import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { CameraPreset } from '../../components/showroom/CameraController';

const presets: Record<'overview' | 'front' | 'side' | 'rear' | 'top', [number, number, number]> = {
  overview: [3.6, 2, -4.9], front: [0, 1.8, -7.1], side: [6.9, 1.9, 0],
  rear: [0, 1.9, 7.1], top: [.01, 7.4, 0],
};
const focus = new THREE.Vector3(0, .35, 0);

function setCameraFov(camera: THREE.PerspectiveCamera, fov: number) {
  camera.fov = fov;
  camera.updateProjectionMatrix();
}

// Preserves the shared controller's OrbitControls, bounded preset transition,
// zoom trigger, and reduced-motion behavior at studio-scale camera distances.
export function StudioCameraController({ preset, trigger, zoomTrigger, zoomDirection, reduced }: {
  preset: CameraPreset; trigger: number; zoomTrigger: number;
  zoomDirection: 'in' | 'out' | null; reduced: boolean;
}) {
  const { camera, size } = useThree();
  const controls = React.useRef<OrbitControlsImpl>(null);
  const destination = React.useRef(new THREE.Vector3(3.6, 2, -4.9));
  const target = React.useRef(focus.clone());
  const moving = React.useRef(true);
  const aspect = size.width / Math.max(size.height, 1);
  const mobileScale = aspect < .75 ? 1.06 : aspect < 1.05 ? 1.12 : 1;
  React.useEffect(() => {
    // Local owner-review capture can inspect both sides of an asymmetric livery.
    (window as Window & { __P6_VIEW__?: (side: 'left' | 'right') => void }).__P6_VIEW__ = (side) => {
      moving.current = false;
      camera.position.set(side === 'left' ? -6.9 : 6.9, 1.9, 0);
      controls.current?.target.copy(focus);
      controls.current?.update();
    };
    (window as Window & { __P6_CAMERA__?: () => number[] }).__P6_CAMERA__ = () => camera.position.toArray();
    return () => { delete (window as Window & { __P6_VIEW__?: unknown }).__P6_VIEW__; delete (window as Window & { __P6_CAMERA__?: unknown }).__P6_CAMERA__; };
  }, [camera]);
  React.useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      setCameraFov(camera, preset === 'top' ? (aspect < .75 ? 50 : 44) : (aspect < .75 ? (preset === 'overview' ? 42 : 58) : 39));
    }
  }, [camera, aspect, preset]);
  React.useEffect(() => {
    const point = aspect < .75 && preset === 'overview' ? [1.5, 1.85, -7.4] as [number, number, number] : presets[preset as keyof typeof presets] ?? presets.overview;
    destination.current.set(...point).multiplyScalar(aspect < .75 && preset === 'overview' ? 1 : mobileScale);
    target.current.copy(focus);
    moving.current = true;
    if (reduced) {
      camera.position.copy(destination.current);
      controls.current?.target.copy(target.current);
      controls.current?.update();
      moving.current = false;
    }
  }, [preset, trigger, mobileScale, aspect, reduced, camera]);
  React.useEffect(() => {
    if (!zoomTrigger || !zoomDirection || !controls.current) return;
    const origin = controls.current.target;
    const vector = camera.position.clone().sub(origin);
    const distance = THREE.MathUtils.clamp(vector.length() * (zoomDirection === 'in' ? .82 : 1.18), 6.5, 23);
    camera.position.copy(origin.clone().add(vector.normalize().multiplyScalar(distance)));
    destination.current.copy(camera.position);
    moving.current = false;
    controls.current.update();
  }, [zoomTrigger, zoomDirection, camera]);
  useFrame((_, delta) => {
    if (!controls.current || !moving.current) return;
    const factor = reduced ? 1 : Math.min(delta * 3.8, 1);
    camera.position.lerp(destination.current, factor);
    controls.current.target.lerp(target.current, factor);
    controls.current.update();
    if (camera.position.distanceTo(destination.current) < .035) moving.current = false;
  });
  return <OrbitControls ref={controls} enableDamping dampingFactor={.06} enableZoom={false} minDistance={5.8} maxDistance={23} maxPolarAngle={Math.PI / 2 - .03} onStart={() => { moving.current = false; }} />;
}
