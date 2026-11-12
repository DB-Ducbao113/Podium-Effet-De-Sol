import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import type {MountedCadPartIdentity} from './mountedCadSceneAudit';

/** Exact verified source-part inventory for mounted four-wheel Model B.
 * This is a visual CAD scene identity audit, not a mechanical mating proof.
 */
export type MountedCadSourceIdentity={
 frontP28:readonly string[];
 rearP28:readonly string[];
 rearToe:readonly string[];
 rearJoint:readonly string[];
};
export type MountedCadIdentityEvidence={
 checkedMounts:4;
 checkedSourceMeshInstances:number;
 sourceNamesExact:true;
 rearP28FrontSourceProxy:true;
 mechanicalMateCertified:false;
};

const wheels:readonly WheelId[]=[
 'front-positive-z','front-negative-z','rear-positive-z','rear-negative-z',
];

function verifyNames(names:readonly string[],label:string){
 if(names.some(name=>typeof name!=='string'||!name.length)||
    new Set(names).size!==names.length)
  throw Error('Duplicate or invalid original CAD source identity: '+label);
}

function sameNames(actual:readonly string[],expected:readonly string[],
 station:WheelId,kind:MountedCadPartIdentity['kind']):void{
 if(actual.length!==expected.length||
    new Set(actual).size!==actual.length||
    actual.some(name=>!expected.includes(name)))
  throw Error('Incorrect original source CAD IDs at '+station+' / '+kind);
}

/** Prevent false PASS on correct counts but wrong source IDs or wheel station.
 * Both manifested names and actual decoded mounted mesh node identities must
 * match exactly at every station; ordering in the source GLB is irrelevant.
 */
export function auditMountedCadIdentity(
 mounted:readonly MountedCadPartIdentity[],
 expected:MountedCadSourceIdentity,
):MountedCadIdentityEvidence{
 for(const [kind,names] of Object.entries(expected))
  verifyNames(names,kind);
 if(expected.frontP28.length!==59||expected.rearP28.length===0||
    expected.rearP28.length>59||
    expected.rearP28.some(name=>!expected.frontP28.includes(name)))
  throw Error('Invalid original P2.8 front/rear proxy source inventory');
 const toe=expected.rearToe.length,joint=expected.rearJoint.length;
 if(!((toe===0&&joint===0)||(toe===19&&joint===0)||
      (toe===15&&joint===16))||
    expected.rearToe.some(name=>expected.rearJoint.includes(name)))
  throw Error('Invalid original P2.12/P2.14 source inventory');
 const set=new Set<string>();
 for(const part of mounted){
  if(!wheels.includes(part.station)||!['p28','rear-toe','joint'].includes(part.kind)||
     typeof part.name!=='string'||!part.name.length)
   throw Error('Unexpected mounted original CAD mesh identity');
  const key=part.station+'|'+part.kind+'|'+part.name;
  if(set.has(key))throw Error('Duplicate mounted original CAD mesh ID '+key);
  set.add(key);
 }
 for(const station of wheels){
  const front=station.startsWith('front-');
  for(const kind of ['p28','rear-toe','joint'] as const){
   const expectedNames=kind==='p28'
     ?(front?expected.frontP28:expected.rearP28)
     :front?[]:kind==='rear-toe'?expected.rearToe:expected.rearJoint;
   const actual=mounted.filter(part=>
     part.station===station&&part.kind===kind).map(part=>part.name);
   sameNames(actual,expectedNames,station,kind);
  }
 }
 const total=2*(expected.frontP28.length+expected.rearP28.length+
    expected.rearToe.length+expected.rearJoint.length);
 if(mounted.length!==total)
  throw Error('Incorrect total mounted original CAD source identities');
 return {
  checkedMounts:4,checkedSourceMeshInstances:total,
  sourceNamesExact:true,rearP28FrontSourceProxy:true,
  mechanicalMateCertified:false,
 };
}
