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
          node.name.includes('TYRE') ? 0.96 :
          node.name.includes('BRAKE_ROTOR') ? 0.84 :
          node.name.includes('CALIPER') ? 0.41 :
          node.name.includes('RIM') ? 0.31 :
          node.name.includes('BEARING') ? 0.23 : 0.43;
        const baselineMetalness =
          node.name.includes('TYRE')?0:
          node.name.includes('BRAKE_ROTOR') ? 0.13 :
          node.name.includes('CALIPER') ? 0.43 :
          node.name.includes('RIM') ? 0.78 :
          node.name.includes('BEARING') ? 0.84 : 0.67;
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

export function P2CinemaCamera({
  model, progress, focusPart, reducedMotion,
}: {
  model: THREE.Group;
  progress: number;
  focusPart: string | null;
  reducedMotion: boolean;
}) {
  const {camera,gl,invalidate} = useThree();
  const look=useMemo(()=>new THREE.Vector3(),[]);
  const desiredPosition=useMemo(()=>new THREE.Vector3(),[]);
  const focusCenter=useMemo(()=>new THREE.Vector3(),[]);
  const direction=useMemo(()=>new THREE.Vector3(),[]);
  const filmTarget=useMemo(()=>new THREE.Vector3(),[]);
  const worldBounds=useMemo(()=>new THREE.Box3(),[]);
  const worldSphere=useMemo(()=>new THREE.Sphere(),[]);
  const lastFocus=useRef<string|null>(null);

  useEffect(()=>invalidate(),[progress,focusPart,invalidate]);
  useFrame((_,delta)=>{
    const frame=p2FilmFrame(progress);
    desiredPosition.set(...frame.position);
    const targetFov=focusPart?30:frame.fov;
    const part=focusPart?model.getObjectByName(focusPart):null;
    if(part){
      // Read ACTUAL current scene graph bounds after CAD explode transforms.
      // Never invent a pivot or rely on a fixed, oversized macro distance.
      model.updateWorldMatrix(true,true);
      worldBounds.setFromObject(part,true);
      if(!worldBounds.isEmpty()){
        worldBounds.getBoundingSphere(worldSphere);
        focusCenter.copy(worldSphere.center);
        const vfov=THREE.MathUtils.degToRad(targetFov*.5);
        const hFov=Math.atan(Math.tan(vfov)*Math.max(camera instanceof THREE.PerspectiveCamera?camera.aspect:1,.2));
        const aperture=Math.max(.001,Math.min(Math.sin(vfov),Math.sin(hFov)));
        const distance=Math.max(.016,worldSphere.radius/aperture*1.65);
        direction.copy(desiredPosition).sub(filmTarget.set(...frame.target)).normalize();
        desiredPosition.copy(focusCenter).addScaledVector(direction,distance);
      }else{
        focusCenter.set(...frame.target);
      }
    }else{
      focusCenter.set(...frame.target);
    }
    // Demand renderer must continue until the short, source-bounded focus
    // ease settles. Direct film scrubbing remains exact and instantaneous.
    const changing=Boolean(part) || lastFocus.current!==null;
    const alpha=changing && !reducedMotion?1-Math.exp(-9*Math.min(delta,.05)):1;
    camera.position.lerp(desiredPosition,alpha);
    look.lerp(focusCenter,alpha);
    camera.lookAt(look);
    if(camera instanceof THREE.PerspectiveCamera &&
       Math.abs(camera.fov-targetFov)>.001){
      camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,alpha);
      camera.updateProjectionMatrix();
    }
    if(changing && (
      camera.position.distanceToSquared(desiredPosition)>0.00000002 ||
      look.distanceToSquared(focusCenter)>0.00000002 ||
      (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov-targetFov)>.001)
    )) invalidate();
    lastFocus.current=focusPart;
    gl.toneMappingExposure=frame.exposure;
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
