import { useEffect, useMemo, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import * as THREE from 'three';
import { layoutFourCorners } from './fourCornerLayout';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';
import {
  REAR_TOE_ADJUSTER_ALL_PARTS, type ToeAdjusterSource,
} from './rearToeAdjusterSource';

type Props = {
  source: ToeAdjusterSource;
  fit: OwnerMeasuredFit;
  onError: (message:string)=>void;
  onLoaded: (message:string)=>void;
};
function disposeSource(root:THREE.Group) {
  const geometries=new Set<THREE.BufferGeometry>();
  const materials=new Set<THREE.Material>();
  root.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    geometries.add(obj.geometry);
    for(const material of Array.isArray(obj.material)?obj.material:[obj.material])
      materials.add(material);
  });
  geometries.forEach(geometry=>geometry.dispose());
  materials.forEach(material=>material.dispose());
}

/** Replace P2.11 static fixed toe rod with original P2.12 19-node CAD.
 * Two measured rear station placements by proper rotation, never mirrored.
 * P2.9/P2.10/P2.11 parent nodes already exist inside the imported source;
 * do not render their previous instances simultaneously.
 * No rear mechanical/chassis or female thread engagement certification.
 */
export default function RearToeAdjusterInstances({
  source,fit,onError,onLoaded,
}:Props) {
  const [scene,setScene]=useState<THREE.Group|null>(null);
  useEffect(()=>{
    let active=true;
    let original:THREE.Group|null=null;
    setScene(null);
    const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    void MeshoptDecoder.ready.then(()=>
      loader.parseAsync(source.glbBytes.slice(0),''),
    ).then(gltf=>{
      original=gltf.scene;
      const meshNames:string[]=[];
      original.traverse(obj=>{
        if(obj instanceof THREE.Mesh)meshNames.push(obj.name);
      });
      if(!active) {
        disposeSource(original);
        return;
      }
      const known=new Set<string>(REAR_TOE_ADJUSTER_ALL_PARTS);
      if(meshNames.length!==19 || new Set(meshNames).size!==19 ||
        meshNames.some(name=>!known.has(name))) {
        disposeSource(original);
        original=null;
        onError('P2.12 original source must contain exactly 19 unique CAD meshes');
        return;
      }
      setScene(original);
      onLoaded('P212 REAR TOE ADJUSTER MESHES PARSED / 19 SOLIDS / TWO REAR STATIONS / G2 HOLD');
    }).catch(err=>{
      if(active)onError('Original P2.12 GLB parse failed: '+String(err));
    });
    return ()=>{
      active=false;
      setScene(null);
      if(original)disposeSource(original);
    };
  },[source,onError,onLoaded]);

  const rearMounts=useMemo(()=>
    layoutFourCorners(fit).filter(mount=>mount.station==='rear'),[fit]);
  const instances=useMemo(()=>
    scene?rearMounts.map(mount=>({mount,view:scene.clone(true)})):[],
    [rearMounts,scene]);
  return <>
    {instances.map(({mount,view})=>
      <group key={mount.id}
        name={'p212-source-rear-adjuster-'+mount.id}
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
