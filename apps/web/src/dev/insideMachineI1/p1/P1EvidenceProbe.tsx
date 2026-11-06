import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FRONT_LEFT_WHEEL_V2 } from '../design/frontLeftWheelV2';
import { blueprintAt, type WheelInspectionScope } from './pilotMotion';
import type { QualityProfile } from '../types';

export type PartTransform = {
  position: number[];
  quaternion: number[];
  scale: number[];
  worldPosition: number[];
  finite: boolean;
};

export type P1SceneEvidence = {
  getState(): {
    progress: number;
    selectedPart: string;
    scope: WheelInspectionScope;
    profile: QualityProfile;
    blueprint: number;
    renderedFrames: number;
    canvas: { width: number; height: number; dpr: number };
    drawCalls: number;
    triangles: number;
    geometryCount: number;
    textureCount: number;
  };
  getTransforms(): Record<string, PartTransform>;
  getCamera(): { position: number[]; direction: number[]; fov: number | null };
  getBounds(partId: string): {
    ndcMinX: number;
    ndcMaxX: number;
    ndcMinY: number;
    ndcMaxY: number;
    outside: boolean;
    clipped: boolean;
  } | null;
};

type EvidenceWindow = Window & {
  __PEDS_ITM_P1_STAGE__?: P1SceneEvidence;
};

function getPartNode(model: THREE.Group, semanticId: string): THREE.Object3D | undefined {
  const part = FRONT_LEFT_WHEEL_V2.find((item) => item.id === semanticId);
  return part ? model.getObjectByName(part.node) : undefined;
}

function partBounds(
  object: THREE.Object3D,
  camera: THREE.Camera,
) {
  object.updateWorldMatrix(true, true);
  camera.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(object, true);
  if (box.isEmpty()) return null;
  const lo = box.min;
  const hi = box.max;
  const ndc = [
    new THREE.Vector3(lo.x, lo.y, lo.z),
    new THREE.Vector3(lo.x, lo.y, hi.z),
    new THREE.Vector3(lo.x, hi.y, lo.z),
    new THREE.Vector3(lo.x, hi.y, hi.z),
    new THREE.Vector3(hi.x, lo.y, lo.z),
    new THREE.Vector3(hi.x, lo.y, hi.z),
    new THREE.Vector3(hi.x, hi.y, lo.z),
    new THREE.Vector3(hi.x, hi.y, hi.z),
  ].map((point) => point.project(camera));

  const minX = Math.min(...ndc.map((p) => p.x));
  const maxX = Math.max(...ndc.map((p) => p.x));
  const minY = Math.min(...ndc.map((p) => p.y));
  const maxY = Math.max(...ndc.map((p) => p.y));
  const outside = maxX < -1 || minX > 1 || maxY < -1 || minY > 1;
  return {
    ndcMinX: minX, ndcMaxX: maxX, ndcMinY: minY, ndcMaxY: maxY,
    outside,
    clipped: minX < -1 || maxX > 1 || minY < -1 || maxY > 1,
  };
}

/**
 * DEV-only read-only evidence bridge for automated browser QA.
 * Never runs in production; never changes model, materials or user controls.
 */
export default function P1EvidenceProbe({
  model, progress, selectedPart, scope, profile,
}: {
  model: THREE.Group;
  progress: number;
  selectedPart: string;
  scope: WheelInspectionScope;
  profile: QualityProfile;
}) {
  const { gl, camera, size, viewport } = useThree();
  const rendered = useRef(0);
  useFrame(() => { rendered.current += 1; });

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const target = window as EvidenceWindow;
    const bridge: P1SceneEvidence = {
      getState: () => ({
        progress,
        selectedPart,
        scope,
        profile,
        blueprint: blueprintAt(progress),
        renderedFrames: rendered.current,
        canvas: { width: size.width, height: size.height, dpr: viewport.dpr },
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometryCount: gl.info.memory.geometries,
        textureCount: gl.info.memory.textures,
      }),
      getTransforms: () => {
        model.updateWorldMatrix(true, true);
        return Object.fromEntries(
          FRONT_LEFT_WHEEL_V2.map((part) => {
            const node = model.getObjectByName(part.node);
            if (!node) throw new Error(`Missing P1 source node ${part.node}`);
            const world = new THREE.Vector3();
            node.getWorldPosition(world);
            const position = node.position.toArray();
            const quaternion = node.quaternion.toArray();
            const scale = node.scale.toArray();
            const worldPosition = world.toArray();
            return [part.id, {
              position, quaternion, scale, worldPosition,
              finite: [...position, ...quaternion, ...scale, ...worldPosition].every(Number.isFinite),
            }];
          }),
        );
      },
      getCamera: () => {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        return {
          position: camera.position.toArray(),
          direction: direction.toArray(),
          fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : null,
        };
      },
      getBounds: (id) => {
        const node = getPartNode(model, id);
        return node ? partBounds(node, camera) : null;
      },
    };
    target.__PEDS_ITM_P1_STAGE__ = bridge;
    return () => {
      if (target.__PEDS_ITM_P1_STAGE__ === bridge) delete target.__PEDS_ITM_P1_STAGE__;
    };
  }, [model, progress, selectedPart, scope, profile, gl, camera, size, viewport]);

  return null;
}
