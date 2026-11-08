import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { classifyP28Part, materialForP28Part, presentationForP28Part,
  type CornerPresentation } from './cadPresentation';
import { layoutFourCorners, visibleInFourCornerPreview, type WheelId } from './fourCornerLayout';
import type { OwnerMeasuredFit } from './ownerMeasuredFit';

type Props = {
  originalFrontCorner: THREE.Group;
  fit: OwnerMeasuredFit;
  activeWheelId: WheelId;
  selectedPart: string | null;
  presentation: CornerPresentation;
  technicalMaterials: boolean;
};

/**
 * Three additional independent source-derived instances:
 * - front negative Z: rotated (never reflected), 59 original front CAD parts
 * - rear +/- Z: genuine front-source wheel-end parts only; no counterfeit
 *   rear wishbones, upright or suspension hardpoints
 *
 * Cloned geometry/materials are view-only, disposed on component teardown.
 * Original GLB bytes and root transforms are unchanged.
 */
export default function FourCornerInstances({
  originalFrontCorner, fit, activeWheelId, selectedPart,
  presentation, technicalMaterials,
}: Props) {
  const instances=useMemo(()=>{
    const mounts=layoutFourCorners(fit).filter(x=>x.id!=='front-positive-z');
    return mounts.map(mount=>{
      const view=originalFrontCorner.clone(true) as THREE.Group;
      const geometries:THREE.BufferGeometry[]=[];
      const materials:THREE.Material[]=[];
      view.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        // Clone each BufferGeometry to prevent presentation toggles or Three.js
        // disposal on one wheel from affecting the other three wheels.
        const geometry=object.geometry.clone();
        geometries.push(geometry);
        object.geometry=geometry;

        const display=presentationForP28Part(object.name,presentation);
        const approvedForDisplay=visibleInFourCornerPreview(object.name,mount.station);
        const inIsolatedView=!(selectedPart&&activeWheelId===mount.id)||
          selectedPart===object.name;
        object.visible=display.visible&&approvedForDisplay&&inIsolatedView;
        object.position.add(new THREE.Vector3(...display.offsetM));

        const old=Array.isArray(object.material)?object.material:[object.material];
        let newMaterials:THREE.Material[];
        if(technicalMaterials){
          const preset=materialForP28Part(classifyP28Part(object.name));
          const selected=selectedPart===object.name && activeWheelId===mount.id;
          const material=new THREE.MeshStandardMaterial({
            color:selected?'#e2e9ef':preset.color,
            metalness:preset.metalness,
            roughness:preset.roughness,
            envMapIntensity:1.55,
            emissive:new THREE.Color(preset.color),
            emissiveIntensity:preset.metalness>0.6?0.18:0.3,
            side:THREE.DoubleSide,
          });
          newMaterials=[material];
        }else{
          newMaterials=old.map(material=>material.clone());
        }
        materials.push(...newMaterials);
        object.material=Array.isArray(object.material)?newMaterials:newMaterials[0];
      });
      return {mount,view,geometries,materials};
    });
  },[originalFrontCorner,fit,activeWheelId,selectedPart,presentation,technicalMaterials]);

  useEffect(()=>()=>{
    for(const instance of instances){
      for(const material of instance.materials)material.dispose();
      for(const geometry of instance.geometries)geometry.dispose();
    }
  },[instances]);

  return <>
    {instances.map(({mount,view})=>
      <group key={mount.id} position={mount.translationM}
        rotation={[0,mount.rotationYRad,0]} scale={1}
        name={'four-corner-'+mount.id}>
        <primitive object={view}/>
      </group>
    )}
  </>;
}
