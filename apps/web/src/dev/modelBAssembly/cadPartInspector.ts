import {classifyP28Part,type PartSystem} from '../assemblyPreview/cadPresentation';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';
import {REAR_TOE_ADJUSTER_ALL_PARTS} from '../assemblyPreview/rearToeAdjusterSource';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';

export type CadPartOrigin='p28'|'rear-toe'|'joint';
export type InspectedCadPart={
 partId:string;
 wheelStation:WheelId;
 origin:CadPartOrigin;
 subsystem:string;
 sourceLabel:string;
 sourceAuthority:'PROJECT_AUTHORED_ORIGINAL_CAD'|'PROJECT_AUTHORED_PROPOSAL';
 sourceWheelEndIsRearProxy:boolean;
 visualOnly:true;
 mechanicalMateCertified:false;
};
const wheelStations:readonly WheelId[]=[
 'front-positive-z','front-negative-z','rear-positive-z','rear-negative-z',
] as const;
const p212=new Set<string>(REAR_TOE_ADJUSTER_ALL_PARTS);
const p214=new Set<string>(P214_PARTS);
const labels:Record<PartSystem,string>={
 tyre:'Slick tyre',rim:'Forged rim','carbon-brake':'Carbon brake rotor',
 caliper:'Brake caliper','friction-pad':'Brake pad',
 bearing:'Bearing',hardware:'Fastener / lock hardware',
 suspension:'Suspension link',upright:'Upright',hub:'Hub',other:'CAD component',
};
/** Resolve only REAL source-mapped mesh picks.
 *
 * The three source bundles have been verified by GLB SHA and semantic
 * identities before their descendants are raycast in Three.js. A pick
 * can never manufacture a missing wheel or claim a mechanical mating.
 */
export function inspectOriginalCadMesh(
 partId:string,
 station:WheelId,
 origin:CadPartOrigin,
 originalP28PartIds:readonly string[],
):InspectedCadPart{
 if(!wheelStations.includes(station))throw Error('Unknown measured Model B wheel station');
 if(!partId||typeof partId!=='string'||partId.length>180)
   throw Error('Invalid original CAD mesh ID');
 const rear=station.startsWith('rear-');
 let subsystem:string;
 let sourceLabel:string;
 let sourceAuthority:InspectedCadPart['sourceAuthority'];
 if(origin==='p28'){
   if(!originalP28PartIds.includes(partId)||new Set(originalP28PartIds).size!==59 ||
      originalP28PartIds.length!==59)
     throw Error('Selected 59-part original P2.8 CAD identity unknown');
   subsystem=labels[classifyP28Part(partId)];
   sourceLabel=rear?'P2.8 front wheel-end / REAR VISUAL PROXY':
     'P2.8 original front wheel-end CAD';
   sourceAuthority='PROJECT_AUTHORED_ORIGINAL_CAD';
 }else if(origin==='rear-toe'){
   if(!rear||!p212.has(partId))throw Error('Invalid original P2.12 rear toe CAD part');
   subsystem=partId.startsWith('P212_')?'RH/LH threaded rear toe adjuster':
     'Rear toe / suspension proposal';
   sourceLabel='P2.12 rear toe CAD source (provisional hardpoints)';
   sourceAuthority='PROJECT_AUTHORED_PROPOSAL';
 }else if(origin==='joint'){
   if(!rear||!p214.has(partId))throw Error('Invalid original P2.14 joint CAD part');
   subsystem=partId.includes('SPLIT_RACE')?'Split spherical bearing race':
     partId.includes('SPHERICAL_BALL')?'Drilled spherical bearing ball':
     'Sliding containment sleeve (axial lock NOT validated)';
   sourceLabel='P2.14 split spherical joint CAD proposal';
   sourceAuthority='PROJECT_AUTHORED_PROPOSAL';
 }else throw Error('Invalid source domain');
 return {
  partId,wheelStation:station,origin,subsystem,sourceLabel,
  sourceAuthority,sourceWheelEndIsRearProxy:rear&&origin==='p28',
  visualOnly:true,mechanicalMateCertified:false,
 };
}
