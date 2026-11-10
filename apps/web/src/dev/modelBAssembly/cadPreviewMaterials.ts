import * as THREE from 'three';
import {
 classifyP28Part,materialForP28Part,type PartSystem,
} from '../assemblyPreview/cadPresentation';

export type CadAppearance={
 system:PartSystem|'rear-joint';
 color:string;
 roughness:number;
 metalness:number;
 envMapIntensity:number;
};
/** Studio PBR palette on CLONED viewer materials; no original GLB/STEP
 * material or geometry bytes are changed. Source identity remains inspectable.
 *
 * The uploaded review exposed WHITE tyres/rims from unmodified GLB default
 * materials. Real slick rubber is dark and nonmetallic; a rim is separately
 * darker metallic aluminium, not the same pale PBR shader as the tyre.
 */
export function cadPreviewAppearance(
 name:string,origin:'p28'|'rear-toe'|'joint',
):CadAppearance{
 const system=origin==='p28'?classifyP28Part(name):
   name.includes('BALL')||name.includes('RACE')||name.includes('SLEEVE')?
     'rear-joint':name.includes('BEARING')?'bearing':
       name.includes('ROD')||name.includes('BOLT')||name.includes('NUT')?
       'hardware':'suspension';
 if(system==='tyre')
   return {system,color:'#171b1f',roughness:.94,metalness:.015,envMapIntensity:.18};
 if(system==='rim')
   return {system,color:'#67737d',roughness:.31,metalness:.77,envMapIntensity:.82};
 if(system==='carbon-brake')
   return {system,color:'#353a41',roughness:.80,metalness:.23,envMapIntensity:.30};
 if(system==='caliper')
   return {system,color:'#ab4e40',roughness:.43,metalness:.55,envMapIntensity:.59};
 if(system==='friction-pad')
   return {system,color:'#514d47',roughness:.85,metalness:.12,envMapIntensity:.27};
 if(system==='rear-joint')
   return {system,color:'#88939c',roughness:.30,metalness:.72,envMapIntensity:.70};
 const base=materialForP28Part(system);
 return {system,color:base.color,roughness:base.roughness,
   metalness:base.metalness,envMapIntensity:system==='hardware'?.70:.56};
}
/** Must operate on a material CLONE, not the user-authored source material.
 * Preserve all the source textures, normal maps and transparency settings.
 */
export function applyCadViewerAppearance(
 material:THREE.Material,appearance:CadAppearance,
):void {
 if(!(material instanceof THREE.MeshStandardMaterial))return;
 material.color.set(appearance.color);
 material.roughness=appearance.roughness;
 material.metalness=appearance.metalness;
 material.envMapIntensity=appearance.envMapIntensity;
 material.toneMapped=true;
 material.needsUpdate=true;
}
