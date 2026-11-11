import React, { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import type { QualityProfile } from './model-b/adaptiveController';
import { getStageFloorSettings, STAGE_COLORS, STAGE_LIGHTING, type StageLighting } from './showroomStageConfig';

function setSceneEnvironment(scene: THREE.Scene, texture: THREE.Texture | null) {
  scene.environment = texture;
}

function setSceneEnvironmentIntensity(scene: THREE.Scene, intensity: number) {
  scene.environmentIntensity = intensity;
}

// A local, network-free studio environment gives the metallic clear-coat paint
// something to reflect; without it the liveries read flat and dark.
export const StudioEnvironment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    setSceneEnvironment(scene, target.texture);
    return () => {
      setSceneEnvironment(scene, null);
      target.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    setSceneEnvironmentIntensity(scene, intensity);
  }, [scene, intensity]);
  return null;
};

export const StageLights: React.FC<{ mode: StageLighting }> = ({ mode }) => {
  const rig = STAGE_LIGHTING[mode];
  return (
    <>
      <hemisphereLight args={[STAGE_COLORS.ambientSky, STAGE_COLORS.ambientGround, rig.ambient]} />
      <directionalLight color={STAGE_COLORS.key} intensity={rig.key} position={[9, 13, -7]} />
      <directionalLight color={STAGE_COLORS.rim} intensity={rig.rim} position={[-7, 5, 12]} />
      <directionalLight color={STAGE_COLORS.fill} intensity={rig.fill} position={[-10, 6, -5]} />
    </>
  );
};

function createReflectorFloor(resolution: number) {
  const mirror = new Reflector(new THREE.CircleGeometry(30, 96), {
    color: STAGE_COLORS.mirrorTint,
    textureWidth: resolution,
    textureHeight: resolution,
    clipBias: 0.003,
    multisample: 0,
  });
  const material = mirror.material as THREE.ShaderMaterial;
  material.fragmentShader = material.fragmentShader.replace(
    'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
    'gl_FragColor = vec4( mix( color * 0.08, blendOverlay( base.rgb, color ), 0.62 ), 1.0 );',
  );
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = -0.02;
  return mirror;
}

function resizeReflectorFloor(mirror: Reflector, resolution: number) {
  const target = mirror.getRenderTarget();
  if (target.width !== resolution || target.height !== resolution) target.setSize(resolution, resolution);
}

function disposeReflectorFloor(mirror: Reflector) {
  mirror.geometry.dispose();
  mirror.dispose();
}

function setReflectorVisibility(mirror: Reflector, visible: boolean) {
  mirror.visible = visible;
}

export const StageFloor: React.FC<{ profile: QualityProfile }> = ({ profile }) => {
  const { gl } = useThree();
  const { reflective, resolution } = getStageFloorSettings(profile);
  const [reflector] = useState(() => createReflectorFloor(resolution));
  useEffect(() => {
    resizeReflectorFloor(reflector, resolution);
  }, [reflector, resolution]);
  useEffect(() => () => {
    gl.renderLists.dispose();
    disposeReflectorFloor(reflector);
  }, [gl, reflector]);
  useFrame(() => setReflectorVisibility(reflector, reflective), -1);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshBasicMaterial color={STAGE_COLORS.background} />
      </mesh>
      <primitive object={reflector} />
    </>
  );
};