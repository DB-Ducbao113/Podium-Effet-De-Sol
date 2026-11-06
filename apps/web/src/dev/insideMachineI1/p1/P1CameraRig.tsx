import { useEffect, useMemo, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import type { PilotFrame } from './pilotMotion';
import { macroLensFor } from './P1MacroLenses';

interface Props {
  frame: PilotFrame;
  model: THREE.Group;
  orbit: boolean;
  focusPart: string | null;
}

const WORLD_UP = new THREE.Vector3(0, 1, 0);

function focusObject(model: THREE.Group, semanticId: string | null) {
  if (!semanticId) return null;
  const component = FRONT_LEFT_WHEEL_V2.find((part) => part.id === semanticId);
  return component ? model.getObjectByName(component.node) : null;
}

/**
 * Camera positions come from the source-anchored six-shot storyboard.
 * Focusing uses actual world-space mesh bounds, NEVER the R4.5 interface's
 * invalid [0,0,0] authoring pivot.
 *
 * Render-demand compatible: the rig explicitly invalidates until a camera
 * transition settles, including when the timeline is paused.
 */
export default function P1CameraRig({ frame, model, orbit, focusPart }: Props) {
  const { camera, invalidate } = useThree();
  const initialized = useRef(false);
  const currentTarget = useRef(new THREE.Vector3(...frame.cameraTarget));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const focusCenter = useMemo(() => new THREE.Vector3(), []);
  const bounds = useMemo(() => new THREE.Box3(), []);
  const sphere = useMemo(() => new THREE.Sphere(), []);
  const filmPosition = useMemo(() => new THREE.Vector3(), []);
  const focusDirection = useMemo(() => new THREE.Vector3(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);

  const part = focusObject(model, focusPart);
  const lens = macroLensFor(focusPart);

  useEffect(() => {
    if (!orbit) invalidate();
  }, [frame, orbit, focusPart, invalidate]);

  useFrame((_, delta) => {
    if (orbit) return;

    filmPosition.set(...frame.cameraPosition);
    desiredPosition.copy(filmPosition);
    desiredTarget.set(...frame.cameraTarget);

    if (part) {
      part.updateWorldMatrix(true, true);
      bounds.setFromObject(part, true);
      if (!bounds.isEmpty()) {
        bounds.getBoundingSphere(sphere);
        focusCenter.copy(sphere.center);
        const radius = Math.max(0.015, sphere.radius);

        const fov = camera instanceof THREE.PerspectiveCamera
          ? THREE.MathUtils.degToRad(camera.fov)
          : THREE.MathUtils.degToRad(35);
        const field = Math.max(0.2, Math.sin(fov / 2));
        const focusDistance = THREE.MathUtils.clamp(
          radius * lens.margin / field,
          lens.minDistance,
          lens.maxDistance,
        );

        focusDirection.set(...lens.direction).normalize();
        desiredTarget.copy(focusCenter);
        desiredPosition.copy(focusCenter).addScaledVector(focusDirection, focusDistance);

        // Give the part breathing space without hiding it behind the
        // surrounding chassis or the external inspection panel.
        cameraRight.crossVectors(focusDirection, WORLD_UP).normalize();
        desiredTarget.addScaledVector(cameraRight, Math.min(radius * 0.20, 0.075));
        desiredPosition.addScaledVector(cameraRight, Math.min(radius * 0.20, 0.075));
      }
    }

    if (!initialized.current) {
      camera.position.copy(desiredPosition);
      currentTarget.current.copy(desiredTarget);
      initialized.current = true;
    } else {
      // Exponential damping is independent of display refresh rate.
      // Reduced-motion users still receive exact final target framing.
      const damping = typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 1
        : 1 - Math.exp(-7.5 * Math.min(delta, 0.05));

      camera.position.lerp(desiredPosition, damping);
      currentTarget.current.lerp(desiredTarget, damping);
    }

    camera.up.copy(WORLD_UP);
    camera.lookAt(currentTarget.current);
    camera.updateMatrixWorld();

    if (
      camera.position.distanceToSquared(desiredPosition) > 0.000001 ||
      currentTarget.current.distanceToSquared(desiredTarget) > 0.000001
    ) {
      invalidate();
    }
  });

  return orbit ? (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={12}
      maxPolarAngle={Math.PI * 0.87}
      target={currentTarget.current.toArray() as [number, number, number]}
    />
  ) : null;
}
