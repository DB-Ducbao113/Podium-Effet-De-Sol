import neutralPalette from '../assemblyPreview/engineeringNeutralPalette.json';
import * as THREE from 'three';
import {
 classifyP28Part,type PartSystem,
} from '../assemblyPreview/cadPresentation';

export type CadAppearance={
 system:PartSystem|'rear-joint';
 color:string;
 roughness:number;
 metalness:number;
 envMapIntensity:number;
};
/** A single neutral grey base color for every CAD part in the Model B build.
 * Tyres, rims, brakes and hardware are differentiated by roughness/metalness,
 * never by separate accent colors. Original GLB/STEP and Model B livery remain
 * immutable; this policy applies only to cloned viewer materials.
 */
export function cadPreviewAppearance(
 name:string,origin:'p28'|'rear-toe'|'joint',
):CadAppearance{
 const system=origin==='p28'?classifyP28Part(name):
   name.includes('BALL')||name.includes('RACE')||name.includes('SLEEVE')?
     'rear-joint':name.includes('BEARING')?'bearing':
       name.includes('ROD')||name.includes('BOLT')||name.includes('NUT')?
       'hardware':'suspension';
 const preset=neutralPalette.presets[system];
 return {system,color:neutralPalette.uniformColor,
   roughness:preset.roughness,metalness:preset.metalness,
   envMapIntensity:preset.envMapIntensity};
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
