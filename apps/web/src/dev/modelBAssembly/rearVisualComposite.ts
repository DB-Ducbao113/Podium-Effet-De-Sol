import {P213_REPLACED_BEARING_PARTS} from '../assemblyPreview/rearJointSource';
import {REAR_TOE_ADJUSTER_ALL_PARTS} from '../assemblyPreview/rearToeAdjusterSource';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';

const matches=(actual:readonly string[],expected:readonly string[])=>
 actual.length===expected.length&&new Set(actual).size===actual.length&&
 actual.every(name=>expected.includes(name));

export type RearVisualParts={
  visiblePartNames:string[];
  count:number;
  originalToeMeshes:19;
  replacementJointMeshes:0|16;
  hiddenOldAnnularBearingProxies:0|4;
  genuineRearMechanicalMateCertified:false;
};
/** Accurate names of one rear station's static source CAD composite.
 *
 * P2.12: 19 project-authored rear solids, including 4 annular bearing
 * placeholders. P2.14: 16 real split-ball-ring CAD bodies replace those
 * four placeholders. 19 - 4 + 16 = 31. Never render 35 or 19 + 16.
 * This is NOT a physical moving assembly or a certified chassis.
 */
export function rearVisualPartIds(
 p212Meshes:readonly string[],
 p214Meshes:readonly string[]|null,
):RearVisualParts{
 if(!matches(p212Meshes,REAR_TOE_ADJUSTER_ALL_PARTS))
   throw Error('P2.12 rear source is not the authentic 19 mesh set');
 if(!p214Meshes){
   return {visiblePartNames:[...p212Meshes],count:19,
     originalToeMeshes:19,replacementJointMeshes:0,
     hiddenOldAnnularBearingProxies:0,
     genuineRearMechanicalMateCertified:false};
 }
 if(!matches(p214Meshes,P214_PARTS))
   throw Error('P2.14 original split bearing mesh identities invalid');
 const hidden=new Set(P213_REPLACED_BEARING_PARTS);
 const retained=p212Meshes.filter(name=>!hidden.has(
   name as typeof P213_REPLACED_BEARING_PARTS[number]));
 if(retained.length!==15||p212Meshes.filter(name=>hidden.has(
   name as typeof P213_REPLACED_BEARING_PARTS[number])).length!==4)
   throw Error('Four former bearing proxies were not removed');
 const visible=[...retained,...p214Meshes];
 if(visible.length!==31||new Set(visible).size!==31)
   throw Error('Rear static CAD must have exactly 31 nonduplicated native mesh names');
 return {visiblePartNames:visible,count:31,
   originalToeMeshes:19,replacementJointMeshes:16,
   hiddenOldAnnularBearingProxies:4,
   genuineRearMechanicalMateCertified:false};
}
