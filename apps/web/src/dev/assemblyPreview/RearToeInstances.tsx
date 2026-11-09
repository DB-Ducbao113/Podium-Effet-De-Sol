import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { layoutFourCorners } from './fourCornerLayout';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import { REAR_TOE_ALL_PARTS, type RearToeSource } from './rearToeSource';

type Props = {
  source:RearToeSource;
  fit:OwnerMeasuredFit;
  onError:(message:string)=>void;
  onLoaded:(message:string)=>void;
};
function disposeLoaded(root:THREE.Group) {
  const meshes=new Set<THREE.BufferGeometry>();
  const mats=new Set<THREE.Material>();
  root.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    meshes.add(o.geometry);
    for(const material of Array.isArray(o.material)?o.material:[o.material])
      mats.add(material);
  });
  meshes.forEach(g=>g.dispose());
  mats.forEach(m=>m.dispose());
}

/** Genuine project-authored P2.9+P2.10+P2.11 source CAD preview (15 meshes).
 * Both rear stations use independently measured original Model B centres.
 * Keep no-scale rigid placement and preserve original mesh chirality. No
 * claim of a physical rear chassis mate or coupled toe/bump kinematics.
 * Source includes P2.9 and P2.10: NEVER double render their old instances.
 */
export default function RearToeInstances({source,fit,onError,onLoaded}:Props) {
  const [scene,setScene]=useState<THREE.Group|null>(null);
  useEffect(()=>{
    let live=true;
    let owned:THREE.Group|null=null;
    setScene(null);
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>
      loader.parseAsync(source.glbBytes.slice(0),''),
    ).then(gltf=>{
      owned=gltf.scene;
      const found:string[]=[];
      owned.traverse(o=>{if(o instanceof THREE.Mesh)found.push(o.name);});
      if(!live){disposeLoaded(owned);return;}
      const expected=new Set<string>(REAR_TOE_ALL_PARTS);
      if(found.length!==15 || new Set(found).size!==15 ||
         found.some(name=>!expected.has(name))){
        disposeLoaded(owned);owned=null;
        onError('P2.11 GLB must contain exactly 15 original named source CAD meshes');
        return;
      }
      setScene(owned);
      onLoaded('P211 REAR TOE SOURCE MESHES PARSED / 15 PARTS / TWO REAR STATIONS / G2 HOLD');
    }).catch(error=>{
      if(live)onError('P2.11 original CAD GLB parse failed: '+String(error));
    });
    return()=>{
      live=false;
      setScene(null);
      if(owned)disposeLoaded(owned);
    };
  },[source,onError,onLoaded]);
  const rear=useMemo(()=>
    layoutFourCorners(fit).filter(w=>w.station==='rear'),
    [fit]);
  const rendered=useMemo(()=>
    scene?rear.map(mount=>({mount,view:scene.clone(true)})):[],
    [rear,scene]);
  return <>
    {rendered.map(({mount,view})=>
      <group key={mount.id}
        name={'p211-rear-toe-static-'+mount.id}
        position={mount.translationM}
        rotation={[0,mount.rotationYRad,0]}
        scale={1}>
        <group position={fit.originalP28WheelCenterM}>
          <primitive object={view}/>
        </group>
      </group>
    )}
  </>;
}
