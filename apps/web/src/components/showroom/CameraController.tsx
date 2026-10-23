import React, { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { HotspotItem } from '../../data/showroom/hotspotsData';

export type CameraPreset =
  | 'overview'
  | 'pano_branding'
  | 'pano_technical'
  | 'pano_drivers'
  | 'pano_achievements'
  | 'branding'
  | 'technical'
  | 'drivers'
  | 'achievements'
  | 'front'
  | 'side'
  | 'cockpit'
  | 'rear'
  | 'top';

interface CameraControllerProps {
  activeHotspot: HotspotItem | null;
  cameraPreset?: CameraPreset | null;
  presetTrigger?: number; // Increment to force re-transition even if same preset is clicked
  autoRotate: boolean;
  enableWheelZoom?: boolean;
  zoomTrigger?: number; // Increment to trigger programmatic zoom
  zoomDirection?: 'in' | 'out' | null;
}

const PRESET_VIEWS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  // ── 1. Toàn Cảnh 4 Vách Triển Lãm (Cinematic Panoramas: Car + Illuminated Wall) ──
  pano_branding: {
    // Vách Logo (Sau xe): Góc 3/4 trước xe nhìn về toàn bộ vách Logo (chuẩn cadillac.webp)
    pos: [3.3, 1.45, -3.2],
    target: [0, 1.4, 2.2],
  },
  pano_technical: {
    // Vách Kỹ Thuật (Trước xe): Góc 3/4 sau xe nhìn về toàn bộ vách Thông số kỹ thuật F1
    pos: [-3.3, 1.5, 3.2],
    target: [0, 1.4, -2.2],
  },
  pano_drivers: {
    // Vách Tay Đua (Trái xe): Nhìn từ mạn phải qua toàn bộ xe sang vách Danh sách tay đua
    pos: [3.8, 1.6, 0.4],
    target: [-2.6, 1.7, 0],
  },
  pano_achievements: {
    // Vách Thành Tích (Phải xe): Nhìn từ mạn trái qua toàn bộ xe sang vách Kỷ lục thành tích
    pos: [-3.8, 1.6, -0.4],
    target: [2.6, 1.7, 0],
  },

  // ── 2. Trực Diện Đọc Bảng 4 Vách (Unobstructed Full-Frame Board View) ──
  branding: {
    // Đứng chính diện nhìn thẳng toàn cảnh bảng Logo (cự ly 6.6m, bao quát 7.8m chiều ngang)
    pos: [0, 2.55, -0.8],
    target: [0, 2.55, 5.8],
  },
  technical: {
    // Đứng chính diện nhìn thẳng toàn cảnh bảng Kỹ thuật (cự ly 6.6m, bao quát 7.8m)
    pos: [0, 2.55, 0.8],
    target: [0, 2.55, -5.8],
  },
  drivers: {
    // Đứng chính diện nhìn thẳng bảng Danh sách tay đua (cự ly 6.6m, bao quát 8.0m)
    pos: [-0.6, 2.55, 0],
    target: [-7.2, 2.55, 0],
  },
  achievements: {
    // Đứng chính diện nhìn thẳng bảng Thành tích (cự ly 6.6m, bao quát 8.0m)
    pos: [0.6, 2.55, 0],
    target: [7.2, 2.55, 0],
  },

  // ── 3. Góc Chi Tiết Xe Đua (Car Focus Presets) ──
  overview: { pos: [2.8, 1.4, -2.8], target: [0, 0.42, 0] },
  front: { pos: [0, 0.95, -4.2], target: [0, 0.35, -0.45] },
  side: { pos: [4.3, 1.05, 0], target: [0, 0.38, 0] },
  cockpit: { pos: [0.75, 1.05, -0.5], target: [0, 0.52, -0.1] },
  rear: { pos: [0, 1.2, 4.0], target: [0, 0.52, 0.65] },
  top: { pos: [0.01, 5.4, 0], target: [0, 0.2, 0] },
};

const DEFAULT_POS = new THREE.Vector3(...PRESET_VIEWS.overview.pos);
const DEFAULT_TARGET = new THREE.Vector3(...PRESET_VIEWS.overview.target);

export const CameraController: React.FC<CameraControllerProps> = React.memo(
  ({
    activeHotspot,
    cameraPreset,
    presetTrigger = 0,
    autoRotate,
    enableWheelZoom = false, // Default false: mouse wheel scrolls webpage, doesn't trap user
    zoomTrigger = 0,
    zoomDirection = null,
  }) => {
    const { camera, size } = useThree();
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const desiredPos = useRef(DEFAULT_POS.clone());
    const desiredTarget = useRef(DEFAULT_TARGET.clone());
    const isTransitioning = useRef<boolean>(true);

    const frameForViewport = useCallback(
      (position: THREE.Vector3, target: THREE.Vector3) => {
        const aspect = size.width / Math.max(size.height, 1);
        const distanceScale = aspect < 0.58 ? 2.6 : aspect < 0.9 ? 2.55 : 1.18;
        return target.clone().add(position.clone().sub(target).multiplyScalar(distanceScale));
      },
      [size.width, size.height],
    );

    // Handle Hotspot and Preset transitions
    useEffect(() => {
      if (activeHotspot) {
        const nextTarget = new THREE.Vector3(...activeHotspot.cameraTarget);
        desiredPos.current.copy(
          frameForViewport(new THREE.Vector3(...activeHotspot.cameraPos), nextTarget),
        );
        desiredTarget.current.copy(nextTarget);
        isTransitioning.current = true;
      } else if (cameraPreset && PRESET_VIEWS[cameraPreset]) {
        const p = PRESET_VIEWS[cameraPreset];
        const nextTarget = new THREE.Vector3(...p.target);
        desiredPos.current.copy(frameForViewport(new THREE.Vector3(...p.pos), nextTarget));
        desiredTarget.current.copy(nextTarget);
        isTransitioning.current = true;
      }
    }, [activeHotspot, cameraPreset, presetTrigger, frameForViewport]);

    // Handle programmatic Zoom In / Zoom Out triggered from UI HUD buttons
    useEffect(() => {
      if (!zoomTrigger || !zoomDirection || !controlsRef.current) return;

      const target = controlsRef.current.target;
      const direction = camera.position.clone().sub(target);
      const currentDist = direction.length();

      const factor = zoomDirection === 'in' ? 0.75 : 1.35;
      const newDist = Math.max(1.0, Math.min(8.0, currentDist * factor));

      direction.normalize().multiplyScalar(newDist);
      camera.position.copy(target.clone().add(direction));
      controlsRef.current.update();
    }, [zoomTrigger, zoomDirection, camera]);

    useFrame((_, delta) => {
      if (!controlsRef.current) return;

      if (isTransitioning.current) {
        const factor = Math.min(delta * 3.5, 1);
        camera.position.lerp(desiredPos.current, factor);
        controlsRef.current.target.lerp(desiredTarget.current, factor);
        controlsRef.current.update();

        const distPos = camera.position.distanceTo(desiredPos.current);
        const distTarget = controlsRef.current.target.distanceTo(desiredTarget.current);

        if (distPos < 0.05 && distTarget < 0.05) {
          camera.position.copy(desiredPos.current);
          controlsRef.current.target.copy(desiredTarget.current);
          controlsRef.current.update();
          isTransitioning.current = false;
        }
      }
    });

    return (
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 + 0.02} // Prevent camera going below floor
        minDistance={0.8}
        maxDistance={14.0}
        enableZoom={enableWheelZoom} // If false, mouse wheel scrolls web page naturally
        autoRotate={autoRotate && !activeHotspot}
        autoRotateSpeed={0.8}
        onStart={() => {
          // User manually dragged the mouse: pause programmatic transition
          isTransitioning.current = false;
        }}
      />
    );
  },
);
