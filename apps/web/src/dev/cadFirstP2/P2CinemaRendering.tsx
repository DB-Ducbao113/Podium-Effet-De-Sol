import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { p2CinemaColor, p2FilmFrame } from './P2CinemaTimeline';

type Snapshot = {
  mesh: THREE.Mesh;
  originals: THREE.Material | THREE.Material[];
  clones: THREE.Material[];
  pbr: Array<{
    material: THREE.MeshStandardMaterial;
    base: THREE.Color;
    studio: THREE.Color;
    roughness: number;
    metalness: number;
  }>;
};

/**
 * P3 studio rendering is deliberately source-preserving.
 * PBR is applied ONLY to material clones and removed on unmount.
 * "Blueprint" is a color/material crossfade, not fabricated CAD internals.
 */
export function P2CinemaSurface({model, progress}: {model:THREE.Group;progress:number}) {
  const {invalidate} = useThree();
  const saved = useRef<Snapshot[]>([]);
  useEffect(() => {
    const items: Snapshot[] = [];
    model.traverse((node) => {
      if(!(node instanceof THREE.Mesh))return;
      const original=node.material;
      const source=Array.isArray(original)?original:[original];
      const clones=source.map((m)=>m.clone());
      const pbr:Snapshot['pbr']=[];
      clones.forEach((c) => {
        if(!(c instanceof THREE.MeshStandardMaterial))return;
        const studio=p2CinemaColor(node.name);
        const baselineRoughness =
          node.name.includes('TYRE')?.96:
          node.name.includes('BRAKE_ROTOR')?.84:
          node.name.includes('CALIPER')?.41:
          node.name.includes('RIM')?.31:
          node.name.includes('BEARING')?.23:.43;
        const baselineMetalness =
          node.name.includes('TYRE')?0:
          node.name.includes('BRAKE_ROTOR')?.13:
          node.name.includes('CALIPER')?.43:
          node.name.includes('RIM')?.78:
          node.name.includes('BEARING')?.84:.67;
        pbr.push({
          material:c,base:c.color.clone(),studio,
          roughness:baselineRoughness,metalness:baselineMetalness,
        });
      });
      node.material=Array.isArray(original)?clones:clones[0];
      items.push({mesh:node,originals:original,clones,pbr});
    });
    saved.current=items;
    invalidate();
    return () => {
      items.forEach(({mesh,originals,clones})=>{
        mesh.material=originals;
        clones.forEach((c)=>c.dispose());
      });
      saved.current=[];
      invalidate();
    };
  },[model,invalidate]);
  const pale = useMemo(()=>new THREE.Color('#e6f2fa'),[]);
  useEffect(()=>invalidate(),[progress,invalidate]);
  useFrame(()=>{
    const blueprint=p2FilmFrame(progress).blueprint;
    for(const {pbr} of saved.current) {
      for(const {material,base,studio,roughness,metalness} of pbr) {
        material.color.copy(base).lerp(studio,.85).lerp(pale,blueprint);
        material.roughness=THREE.MathUtils.lerp(roughness,.91,blueprint);
        material.metalness=THREE.MathUtils.lerp(metalness,.03,blueprint);
      }
    }
  });
  return null;
}

export function P2CinemaCamera({progress}: {progress:number}) {
  const {camera,gl,invalidate}=useThree();
  const look=useMemo(()=>new THREE.Vector3(),[]);
  useEffect(()=>invalidate(),[progress,invalidate]);
  useFrame(()=>{
    const shot=p2FilmFrame(progress);
    camera.position.set(...shot.position);
    look.set(...shot.target);
    camera.lookAt(look);
    if(camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov-shot.fov)>.001){
      camera.fov=shot.fov;
      camera.updateProjectionMatrix();
    }
    gl.toneMappingExposure=shot.exposure;
  });
  return null;
}

export function P2CinemaLightRig({progress}: {progress:number}) {
  const blueprint=p2FilmFrame(progress).blueprint;
  return <>
    <ambientLight intensity={1.00+blueprint*.64}/>
    <hemisphereLight args={['#e6f3ff','#23354a',1.7+blueprint*.6]}/>
    <directionalLight position={[3,7,9]} intensity={3.4-blueprint*.7} color="#f4f7ff"/>
    <directionalLight position={[-5,4,-5]} intensity={1.6-blueprint*.6} color="#ff9476"/>
    <directionalLight position={[-3,6,3]} intensity={2.15+blueprint*.3} color="#b2e9ff"/>
  </>;
}
