import type {WheelId} from '../assemblyPreview/fourCornerLayout';

/** Exact source mesh nodes instantiated by the Model B visual scene.
 * This is NOT a mechanical mate or the number of certified vehicle parts.
 */
export type MountedCadPartIdentity={
 station:WheelId;
 kind:'p28'|'rear-toe'|'joint';
 name:string;
};
export type MountedCadSceneAudit={
 model:'MODEL_B_REAL_SOURCE_VISUAL_ONLY';
 stations:4;
 frontP28PerStation:59;
 rearFrontSourceProxyPerStation:number;
 rearToePerStation:0|15;
 rearJointPerStation:0|16;
 mountedMeshInstances:number;
 rearUsesFrontSourceWheelEndProxy:true;
 genuineRearSuspensionAvailable:false;
 mechanicalMateCertified:false;
};
const STATIONS:readonly WheelId[]=[
 'front-positive-z','front-negative-z','rear-positive-z','rear-negative-z',
];

/**
 * Fail closed on any missing wheel station, repeated source part, incomplete
 * rear P2.12/P2.14 replacement, or front parts staged in the rear assembly.
 * Source names and station IDs originate from the decoded, SHA-checked GLBs.
 */
export function auditMountedCadScene(
 parts:readonly MountedCadPartIdentity[],
):MountedCadSceneAudit{
 const known=new Set<string>();
 const counts=new Map<string,number>();
 for(const part of parts){
  if(!STATIONS.includes(part.station)||
     !['p28','rear-toe','joint'].includes(part.kind)||
     typeof part.name!=='string'||part.name.length===0)
   throw Error('Invalid original Model B mounted source part identity');
  const key=part.station+'|'+part.kind+'|'+part.name;
  if(known.has(key))
   throw Error('Duplicate original Model B mounted source part '+key);
  known.add(key);
  const category=part.station+'|'+part.kind;
  counts.set(category,(counts.get(category)??0)+1);
 }
 const count=(station:WheelId,kind:MountedCadPartIdentity['kind'])=>
  counts.get(station+'|'+kind)??0;
 const fronts=STATIONS.filter(s=>s.startsWith('front'));
 const rears=STATIONS.filter(s=>s.startsWith('rear'));
 for(const station of fronts){
  if(count(station,'p28')!==59||
     count(station,'rear-toe')!==0||count(station,'joint')!==0)
   throw Error('Front original CAD 59-part wheel station incomplete: '+station);
 }
 const rearProxies=rears.map(station=>count(station,'p28'));
 if(rearProxies.some(v=>v<1||v>59)||rearProxies[0]!==rearProxies[1])
  throw Error('Rear original P2.8 wheel-end visual proxies mismatch');
 const toe=rears.map(station=>count(station,'rear-toe'));
 const joint=rears.map(station=>count(station,'joint'));
 if(toe.some(v=>v!==toe[0])||joint.some(v=>v!==joint[0])||
    (toe[0]!==0&&toe[0]!==15)||
    (joint[0]!==0&&joint[0]!==16)||
    (joint[0]===16&&toe[0]!==15))
  throw Error('Rear original P2.12/P2.14 visible source set incomplete');
 const expected=118+rearProxies[0]*2+(toe[0]+joint[0])*2;
 if(expected!==parts.length)
  throw Error('Mounted Model B CAD scene source mesh count mismatch');
 return {
  model:'MODEL_B_REAL_SOURCE_VISUAL_ONLY',
  stations:4,
  frontP28PerStation:59,
  rearFrontSourceProxyPerStation:rearProxies[0],
  rearToePerStation:toe[0] as 0|15,
  rearJointPerStation:joint[0] as 0|16,
  mountedMeshInstances:parts.length,
  rearUsesFrontSourceWheelEndProxy:true,
  genuineRearSuspensionAvailable:false,
  mechanicalMateCertified:false,
 };
}
