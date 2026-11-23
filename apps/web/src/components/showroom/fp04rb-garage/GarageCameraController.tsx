import React, { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { WheelCorner } from './fp04rbLoader';
import type { BayFocus, CameraPresetId, GarageMode } from './inspectionParts';
import {
  applyPerspectiveCameraFov,
  enforceCameraCollisionBounds,
  resolveGarageCameraPreset,
  snapCameraPose,
  stepCameraTowardPose,
} from './garageCameraMath';

export interface GarageCameraControllerProps {
  preset: CameraPresetId;
  bayFocus: BayFocus;
  mode: GarageMode;
  selectedPartId: string;
  maintenanceCorner: WheelCorner;
  reducedMotion: boolean;
  /** Increment when a preset/focus button was clicked; deliberately excludes teamId so 11-team switches never reset camera */
  cameraTriggerVersion: number;
}

export const GarageCameraController: React.FC<GarageCameraControllerProps> = ({
  preset,
  bayFocus,
  mode,
  selectedPartId,
  maintenanceCorner,
  reducedMotion,
  cameraTriggerVersion,
}) => {
  const { camera, size, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const desiredPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0.25, 2.75, 5.45));
  const desiredTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.65, -0.8));
  const animatingRef = useRef(false);

  useEffect(() => {
    applyPerspectiveCameraFov(camera, size.width, size.height);
    invalidate();
  }, [camera, size.width, size.height, invalidate]);

  useEffect(() => {
    const pose = resolveGarageCameraPreset({
      preset,
      bayFocus,
      mode,
      selectedPartId,
      maintenanceCorner,
    });
    desiredPosRef.current.copy(pose.position);
    desiredTargetRef.current.copy(pose.target);

    if (reducedMotion || cameraTriggerVersion === 0) {
      snapCameraPose(camera, controlsRef.current, pose);
      animatingRef.current = false;
      invalidate();
      return;
    }

    animatingRef.current = true;
    invalidate();
  }, [
    preset,
    bayFocus,
    mode,
    selectedPartId,
    maintenanceCorner,
    reducedMotion,
    cameraTriggerVersion,
    camera,
    invalidate,
  ]);

  useFrame((_, delta) => {
    if (animatingRef.current) {
      const alpha = 1 - Math.exp(-Math.min(delta, 0.08) * 7.5);
      animatingRef.current = stepCameraTowardPose(
        camera,
        controlsRef.current,
        desiredPosRef.current,
        desiredTargetRef.current,
        alpha,
      );
    }
    enforceCameraCollisionBounds(camera);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      autoRotate={false}
      enablePan
      maxPolarAngle={Math.PI * 0.49}
      minPolarAngle={0.08}
      minDistance={1.15}
      maxDistance={10.8}
      onStart={() => {
        animatingRef.current = false;
      }}
    />
  );
};
