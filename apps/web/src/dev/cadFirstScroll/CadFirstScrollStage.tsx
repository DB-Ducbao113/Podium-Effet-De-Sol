import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshoptDecoder } from 'meshoptimizer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { CadSource } from './cadSource';
type Props={source:CadSource;focus:string|null;onReady:()=>void;onError:(message:string)=>void};
function Rig({model,focus}:{model:THREE.Group;focus:string|null}){
  const {camera,invalidate,size}=useThree();
  const currentTarget=useRef(new THREE.Vector3());
  const desiredTarget=useRef(new THREE.Vector3());
  const desiredPosition=useRef(new THREE.Vector3());
  const bounds=useMemo(()=>new THREE.Box3(),[]);
  useEffect(()=>{
    model.updateWorldMatrix(true,true);
    const target=focus?model.getObjectByName(focus):model;
    bounds.setFromObject(target??model);
    if(bounds.isEmpty())return;
    const sphere=bounds.getBoundingSphere(new THREE.Sphere());
    desiredTarget.current.copy(sphere.center);
    const aspect=Math.max(.45,size.width/Math.max(size.height,1));
    const fov=camera instanceof THREE.PerspectiveCamera?camera.fov:40;
    const v=THREE.MathUtils.degToRad(fov/2);
    const h=Math.atan(Math.tan(v)*aspect);
    const distance=Math.max(.01,(sphere.radius/Math.max(.03,Math.min(Math.sin(v),Math.sin(h))))*1.55);
    desiredPosition.current.copy(sphere.center).addScaledVector(new THREE.Vector3(1,.62,1.1).normalize(),distance);
    invalidate();
  },[model,focus,model.uuid,bounds,camera,invalidate,size.width,size.height]);
  useFrame(()=>{
    camera.position.lerp(desiredPosition.current,.14);
    currentTarget.current.lerp(desiredTarget.current,.14);
    camera.lookAt(currentTarget.current);
    camera.updateMatrixWorld();
    if(camera.position.distanceToSquared(desiredPosition.current)>0.00000004||currentTarget.current.distanceToSquared(desiredTarget.current)>0.00000004)invalidate();
  });
  return null;
}
function Parts({model,focus}:{model:THREE.Group;focus:string|null}){
  useEffect(()=>{
    const materials:THREE.Material[]=[];
    const snapshot=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
    model.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      snapshot.set(o,o.material);
      const base=Array.isArray(o.material)?o.material:[o.material];
      const clones=base.map(m=>{
        const clone=m.clone();
        clone.transparent=Boolean(focus);
        clone.opacity=focus ? .13 : 1;
        clone.depthWrite=!focus;
        materials.push(clone);return clone;
      });
      const belongs=()=>{
        let cur:THREE.Object3D|null=o;
        while(cur){if(cur.name===focus)return true;cur=cur.parent;}
        return false;
      };
      if(!focus||belongs()){clones.forEach((m,i)=>{
        m.opacity=base[i].opacity;
        m.transparent=base[i].transparent;
        m.depthWrite=base[i].depthWrite;
      });}
      o.material=Array.isArray(o.material)?clones:clones[0];
    });
    return()=>{for(const [mesh,original] of snapshot)mesh.material=original;materials.forEach(m=>m.dispose());};
  },[model,focus]);
  return <primitive object={model}/>;
}
export default function CadFirstScrollStage({source,focus,onReady,onError}:Props){
  const [scene,setScene]=useState<THREE.Group|null>(null);
  const liveModel=useRef<THREE.Group|null>(null);
  useEffect(()=>{
    let alive=true;
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.parse(source.glbBytes.slice(0),'',(gltf)=>{
      if(!alive)return;
      const model=gltf.scene;
      const names=new Set<string>();
      let count=0;
      model.traverse(obj=>{if(obj instanceof THREE.Mesh){count++;names.add(obj.name);}});
      // No guessed node identities: the file must contain all authored IDs.
      const matched=source.parts.filter(part=>model.getObjectByName(part.node)||names.has(part.node));
      if(matched.length!==source.parts.length || count<source.parts.length){
        onError('CAD node manifest mismatch: '+matched.length+'/'+source.parts.length+' names, '+count+' meshes');
        return;
      }
      liveModel.current=model;setScene(model);onReady();
    },(error)=>{if(alive)onError(String(error));});
    return()=> {
      alive=false;
      const model=liveModel.current;liveModel.current=null;
      if(model){
        const geometries=new Set<THREE.BufferGeometry>();
        const materials=new Set<THREE.Material>();
        const textures=new Set<THREE.Texture>();
        model.traverse(obj=>{
          if(!(obj instanceof THREE.Mesh))return;
          geometries.add(obj.geometry);
          for(const material of Array.isArray(obj.material)?obj.material:[obj.material]){
            materials.add(material);
            for(const value of Object.values(material)) if(value instanceof THREE.Texture) textures.add(value);
          }
        });
        geometries.forEach(value=>value.dispose());
        materials.forEach(value=>value.dispose());
        textures.forEach(value=>value.dispose());
      }
    };
  },[source,onError,onReady]);
  return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{fov:36,position:[2,2,3],near:.00001,far:250}}
    gl={{antialias:true,powerPreference:'high-performance'}}
    onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.12;}}>
    <color attach="background" args={['#080d15']}/>
    <ambientLight intensity={1.4}/>
    <hemisphereLight args={['#e7f3ff','#23354a',1.9]}/>
    <directionalLight position={[3,7,9]} intensity={3.6} color="#f4f7ff"/>
    <directionalLight position={[-5,4,-5]} intensity={2.3} color="#ff9476"/>
    {scene&&<><Parts model={scene} focus={focus}/><Rig model={scene} focus={focus}/></>}
  </Canvas>;
}
