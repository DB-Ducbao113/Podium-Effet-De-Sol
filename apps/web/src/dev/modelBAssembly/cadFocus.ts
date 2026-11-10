import * as THREE from 'three';
import type {InspectedCadPart} from './cadPartInspector';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';

export type SourceFocusItem={
  name:string;
  station:WheelId;
  origin:'p28'|'rear-toe'|'joint';
  mesh:THREE.Mesh;
  materials:THREE.Material[];
};
/** Each position comes ONLY from a SHA-verified, source-named mesh.
 * There are no generated focus markers or synthetic objects.
 */
export function locateSelectedCadMesh<T extends SourceFocusItem>(
  items:readonly T[],picked:InspectedCadPart|null,
):T|null{
 if(!picked)return null;
 const found=items.filter(item=>
   item.name===picked.partId&&item.station===picked.wheelStation&&
   item.origin===picked.origin);
 if(found.length!==1)
   throw Error('Selected original CAD part must resolve to one measured wheel mesh');
 return found[0];
}
/** The source mesh local geometry often has vertices far from its Object3D
 * origin, so world position alone gives an incorrect close-up target.
 * Transform the actual mesh bounding-box centre by its current world matrix.
 */
export function sourceMeshWorldCentre(mesh:THREE.Mesh,target=new THREE.Vector3()){
 if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
 if(!mesh.geometry.boundingBox||mesh.geometry.boundingBox.isEmpty())
   throw Error('Cannot focus a mesh without real CAD vertex bounds');
 mesh.updateWorldMatrix(true,false);
 mesh.geometry.boundingBox.getCenter(target).applyMatrix4(mesh.matrixWorld);
 if(![target.x,target.y,target.z].every(Number.isFinite))
   throw Error('Original CAD focus point is nonfinite');
 return target;
}
export function highlightSourceMaterials(
 items:readonly SourceFocusItem[],picked:InspectedCadPart|null,
):()=>void{
 const restorations:{material:THREE.MeshStandardMaterial;emissive:THREE.Color;
   intensity:number}[]=[];
 const focus=locateSelectedCadMesh(items,picked);
 if(!focus)return ()=>{};
 const seen=new Set<THREE.Material>();
 for(const material of focus.materials){
  if(seen.has(material))continue;
  seen.add(material);
  if(!(material instanceof THREE.MeshStandardMaterial))continue;
  restorations.push({
    material,emissive:material.emissive.clone(),
    intensity:material.emissiveIntensity,
  });
  // Only alter CLONED viewer materials; original GLB source never changes.
  material.emissive.set('#f79259');
  material.emissiveIntensity=.68;
 }
 return()=>{
  for(const old of restorations){
   old.material.emissive.copy(old.emissive);
   old.material.emissiveIntensity=old.intensity;
  }
 };
}
