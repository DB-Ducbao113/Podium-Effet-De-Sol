import { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import type { CadSource } from '../cadFirstScroll/cadSource';
import { centerOffset, initialStagingPosition, type Placement } from './assemblyPlacement';

type Props = {
  source: CadSource | null;
  placement: Placement;
  shellOpacity: number;
  selectedPart: string | null;
  onError: (message: string) => void;
  onInfo: (info: string) => void;
};

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.add(o.geometry);
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      materials.add(material);
      Object.values(material).forEach(value=>{if(value instanceof THREE.Texture) textures.add(value);});
    }
  });
  geometries.forEach(x=>x.dispose());
  materials.forEach(x=>x.dispose());
  textures.forEach(x=>x.dispose());
}

function Scene({source,placement,shellOpacity,selectedPart,onError,onInfo}:Props) {
  const {camera,invalidate} = useThree();
  const [body,setBody] = useState<THREE.Group | null>(null);
  const [corner,setCorner] = useState<THREE.Group | null>(null);
  useEffect(()=>{
    let live=true,model:THREE.Group|null=null;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    // This is the existing owner-selected optimized showroom asset in THIS repo.
    loader.load(import.meta.env.BASE_URL+'models/model-b-eds-optimized-v1.glb',gltf=>{
      model=gltf.scene;
      if(!live){disposeTree(model);return;}
      setBody(model);
    },undefined,e=>{if(live)onError('Model B could not load: '+String(e));});
    return()=>{live=false;setBody(null);if(model)disposeTree(model);};
  },[onError]);
  useEffect(()=>{
    let live=true,model:THREE.Group|null=null;
    setCorner(null);
    if(!source)return;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>loader.parseAsync(source.glbBytes.slice(0),'')).then(gltf=>{
      model=gltf.scene;
      if(!live){disposeTree(model);return;}
      const found=new Set<string>();
      model.traverse(o=>{if(o instanceof THREE.Mesh)found.add(o.name);});
      if(source.scope!=='front-corner' || source.parts.length!==59 ||
         source.parts.some(p=>!model?.getObjectByName(p.node)) || found.size!==59){
        onError('P2.8 part identity mismatch; must contain exactly 59 source CAD meshes.');
        disposeTree(model);model=null;return;
      }
      setCorner(model);
      onInfo('MODEL B + VERIFIED P2.8 LOADED · NOT MECHANICALLY MATED');
    }).catch(e=>{if(live)onError('P2.8 GLB could not load: '+String(e));});
    return()=>{live=false;setCorner(null);if(model)disposeTree(model);};
  },[source,onError,onInfo]);
  const bodyBounds=useMemo(()=>body?new THREE.Box3().setFromObject(body):null,[body]);
  const cornerBounds=useMemo(()=>corner?new THREE.Box3().setFromObject(corner):null,[corner]);
  const frame=useMemo(()=>{
    if(!bodyBounds)return {target:new THREE.Vector3(),distance:6};
    const size=bodyBounds.getSize(new THREE.Vector3());
    return {target:bodyBounds.getCenter(new THREE.Vector3()),
      distance:Math.max(2,size.length()*1.4)};
  },[bodyBounds]);
  useEffect(()=>{
    camera.position.copy(frame.target).add(new THREE.Vector3(.85,.45,1).normalize().multiplyScalar(frame.distance));
    camera.lookAt(frame.target);
    camera.updateProjectionMatrix();
    invalidate();
  },[frame,camera,invalidate]);
  useEffect(()=>{if(!body)return;
    const original=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>(),clones:THREE.Material[]=[];
    body.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      original.set(o,o.material);
      const sourceMaterials=Array.isArray(o.material)?o.material:[o.material];
      const modified=sourceMaterials.map(m=>{
        const copy=m.clone();clones.push(copy);
        copy.transparent=shellOpacity<.999||m.transparent;
        copy.opacity=m.opacity*shellOpacity;
        copy.depthWrite=shellOpacity>=.999;
        return copy;
      });
      o.material=Array.isArray(o.material)?modified:modified[0];
    });
    invalidate();
    return()=>{original.forEach((mat,mesh)=>mesh.material=mat);clones.forEach(c=>c.dispose());invalidate()};
  },[body,shellOpacity,invalidate]);
  useEffect(()=>{if(!corner)return;
    corner.traverse(o=>{if(o instanceof THREE.Mesh)o.visible=!selectedPart||o.name===selectedPart;});
    invalidate();
    return()=>{corner.traverse(o=>{if(o instanceof THREE.Mesh)o.visible=true;});};
  },[corner,selectedPart,invalidate]);
  const transform=useMemo(()=>{
    if(!bodyBounds||!cornerBounds)return new THREE.Vector3();
    const bodyMin=bodyBounds.min.toArray() as [number,number,number];
    const bodyMax=bodyBounds.max.toArray() as [number,number,number];
    const cornerMin=cornerBounds.min.toArray() as [number,number,number];
    const base=placement.displayedAtBodyCenter
      ? centerOffset(bodyBounds.getCenter(new THREE.Vector3()).toArray() as [number,number,number],
          cornerBounds.getCenter(new THREE.Vector3()).toArray() as [number,number,number])
      : initialStagingPosition(bodyMin,bodyMax,cornerMin);
    return new THREE.Vector3(...base).add(new THREE.Vector3(...placement.translationM));
  },[bodyBounds,cornerBounds,placement]);
  const rotation=placement.rotationDeg.map(x=>THREE.MathUtils.degToRad(x)) as [number,number,number];
  useEffect(()=>invalidate(),[transform,placement,selectedPart,invalidate]);
  return <>
    <color attach="background" args={['#0a111b']}/>
    <ambientLight intensity={1.5}/><hemisphereLight args={['#eff5ff','#1a2a3d',2]}/>
    <directionalLight position={[5,8,6]} intensity={3.2}/>
    <directionalLight position={[-4,4,-3]} intensity={2} color="#ff9d84"/>
    {body&&<primitive object={body}/>}
    {corner&&<group position={transform.toArray()} rotation={rotation} scale={1}>
       <primitive object={corner}/>
    </group>}
    <OrbitControls makeDefault target={frame.target.toArray()} enableDamping dampingFactor={.08}/>
  </>;
}
export default function AssemblyPreviewStage(props:Props) {
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{fov:38,near:.001,far:500,position:[5,3,8]}}
    gl={{antialias:true,powerPreference:'high-performance'}}
    onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping}}>
    <Scene {...props}/>
  </Canvas>;
}
