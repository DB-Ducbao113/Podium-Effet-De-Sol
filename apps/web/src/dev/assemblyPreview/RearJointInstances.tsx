import {useEffect,useMemo,useState} from 'react';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';
import * as THREE from 'three';
import {layoutFourCorners} from './fourCornerLayout';
import type {OwnerMeasuredFit} from './ownerMeasuredFit';
import {P213_PARTS,type RearJointSource} from './rearJointSource';

type Props={
  source:RearJointSource;
  fit:OwnerMeasuredFit;
  onError:(message:string)=>void;
  onLoaded:(message:string)=>void;
};
function dispose(root:THREE.Group){
  const geoms=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    geoms.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  });
  geoms.forEach(g=>g.dispose());
  materials.forEach(m=>m.dispose());
}

/** P2.13 STATIC native CAD demonstration in the two rear Model B stations.
 * P2.12's four old annular proxies must be hidden by the parent visual.
 * This component does not animate the constrained 6DOF source poses; the
 * 7-angle native pair review is source-only and all mechanical G2 stays HOLD.
 */
export default function RearJointInstances({source,fit,onError,onLoaded}:Props){
  const [scene,setScene]=useState<THREE.Group|null>(null);
  useEffect(()=>{
    let active=true;
    let original:THREE.Group|null=null;
    setScene(null);
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>loader.parseAsync(source.glbBytes.slice(0),''))
      .then(gltf=>{
        original=gltf.scene;
        const nodes:string[]=[];
        original.traverse(o=>{if(o instanceof THREE.Mesh)nodes.push(o.name)});
        if(!active){dispose(original);return;}
        const expected=new Set(P213_PARTS);
        if(nodes.length!==8 || new Set(nodes).size!==8 ||
           nodes.some(node=>!expected.has(node))){
          dispose(original);original=null;
          onError('P2.13 source GLB must have exactly eight authentic CAD mesh names');
          return;
        }
        setScene(original);
        onLoaded('P213 FOUR SPHERICAL JOINT PAIRS PARSED / 8 CAD SOLIDS / G2 HOLD');
      }).catch(error=>{
        if(active)onError('P2.13 GLB parse failed: '+String(error));
      });
    return()=>{
      active=false;
      setScene(null);
      if(original)dispose(original);
    };
  },[source,onError,onLoaded]);
  const mounts=useMemo(
    ()=>layoutFourCorners(fit).filter(p=>p.station==='rear'),[fit]);
  const clones=useMemo(
    ()=>scene?mounts.map(m=>({m,view:scene.clone(true)})):[],[scene,mounts]);
  return <>
    {clones.map(({m,view})=>
      <group key={m.id} name={'p213-provisional-spherical-joints-'+m.id}
        position={m.translationM} rotation={[0,m.rotationYRad,0]} scale={1}>
        <group position={fit.originalP28WheelCenterM}>
          <primitive object={view}/>
        </group>
      </group>
    )}
  </>;
}
