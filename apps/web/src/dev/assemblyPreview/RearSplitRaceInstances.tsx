import {useEffect,useMemo,useState} from 'react';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
import * as THREE from 'three';
import {layoutFourCorners} from './fourCornerLayout';
import type {OwnerMeasuredFit} from './ownerMeasuredFit';
import {P214_PARTS,type SplitRaceSource} from './splitRaceSource';
type Props={
 source:SplitRaceSource;fit:OwnerMeasuredFit;
 onError:(message:string)=>void;onLoaded:(message:string)=>void;
};
function dispose(root:THREE.Group){
 const geoms=new Set<THREE.BufferGeometry>();
 const mats=new Set<THREE.Material>();
 root.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  geoms.add(o.geometry);
  for(const mat of Array.isArray(o.material)?o.material:[o.material])mats.add(mat);
 });
 geoms.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
}
/** Original P2.14 16-body static CAD at two independently measured rear
 * Model B positions. This REPLACES the 8-body P2.13 visualization and four
 * old P2.12 bearing proxies. Not a certified mechanical articulation.
 */
export default function RearSplitRaceInstances({source,fit,onError,onLoaded}:Props){
 const [scene,setScene]=useState<THREE.Group|null>(null);
 useEffect(()=>{
  let active=true;let original:THREE.Group|null=null;
  setScene(null);
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  void MeshoptDecoder.ready.then(()=>loader.parseAsync(source.glbBytes.slice(0),''))
   .then(gltf=>{
    original=gltf.scene;
    const names:string[]=[];
    original.traverse(o=>{if(o instanceof THREE.Mesh)names.push(o.name);});
    if(!active){dispose(original);return;}
    const expected=new Set<string>(P214_PARTS);
    if(names.length!==16||new Set(names).size!==16||
       names.some(name=>!expected.has(name))){
      dispose(original);original=null;
      onError('P2.14 GLB must contain exactly 16 original CAD source meshes');
      return;
    }
    setScene(original);
    onLoaded('P214 SPLIT SPHERICAL RACE 16 CAD MESHES PARSED / 2 REAR STATIONS / G2 HOLD');
   }).catch(error=>{
    if(active)onError('P2.14 source GLB parse failed: '+String(error));
   });
  return()=>{active=false;setScene(null);if(original)dispose(original);};
 },[source,onError,onLoaded]);
 const mounts=useMemo(
  ()=>layoutFourCorners(fit).filter(m=>m.station==='rear'),[fit]);
 const clones=useMemo(
  ()=>scene?mounts.map(m=>({m,view:scene.clone(true)})):[],[scene,mounts]);
 return <>
  {clones.map(({m,view})=>
   <group key={m.id} name={'p214-static-split-race-'+m.id}
     position={m.translationM} rotation={[0,m.rotationYRad,0]} scale={1}>
     <group position={fit.originalP28WheelCenterM}>
       <primitive object={view}/>
     </group>
   </group>
  )}
 </>;
}
