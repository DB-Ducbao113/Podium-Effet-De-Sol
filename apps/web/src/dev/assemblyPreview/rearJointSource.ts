import { checkGlb, sha256, type Profile } from '../cadFirstScroll/cadSource';

export const P213_SCHEMA='podium-eds.p213.source-spherical-joint-articulation.v1';
const STATIONS=['UPPER','LOWER','TOE_OUTER','TOE_INNER'] as const;
export const P213_REPLACED_BEARING_PARTS=[
  'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
  'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
  'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
  'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
] as const;
export const P213_PARTS=STATIONS.flatMap(station=>[
  'P213_'+station+'_OUTER_SPHERICAL_RACE',
  'P213_'+station+'_DRILLED_SPHERICAL_BALL',
]);
const SOURCES=['p2_9_rear_upright.py','p2_10_rear_wishbone.py',
  'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
  'p2_12_constrained_kinematics.py'];
const TIERS:Profile[]=['HIGH','BALANCED','PERFORMANCE'];
const validSHA=(v:unknown):v is string=>
  typeof v==='string' && /^[a-f0-9]{64}$/i.test(v);
const idsEqual=(names:unknown,expected:readonly string[])=>
  Array.isArray(names) && names.length===expected.length &&
  new Set(names).size===expected.length &&
  names.every(name=>typeof name==='string' && expected.includes(name));
type QualityRecord={
  file:string;sha256:string;triangles:number;bytes:number;
  meshCount:8;allWatertight:true;
};
export type RearJointManifest={
  schema:typeof P213_SCHEMA;
  unitsCad:'mm';unitsGLB:'m';
  sourceCadFileSha256:Record<string,string>;
  replaceAnnularProxies:Record<string,string>;
  newCadPartIds:string[];newCadSolids:8;replacedOldCadSolids:4;
  candidateCombinedCadSolids:23;
  stepRoundtripSolids:8;masterSTEPsha256:string;
  nominalSphericalRadialGapMm:number;
  sphericalBallRetainedCertified:false;
  actualSphericalArticulationCertified:false;
  chassisHardpointsMeasured:false;
  wholeCarClearanceCertified:false;
  continuousSweptCollisionCertified:false;
  anglesDeg:number[];poseCount:7;
  combinedNominalStaticAudit:{
    pairCount:253;aabbExcluded:number;nativeBrepIntersectionsEvaluated:number;
    unresolvedCollisions:unknown[];booleanErrors:unknown[];
    passStatic:true;dynamicKinematicsCertified:false;
  };
  poseReviews:{angleDeg:number;jointCount:4;cases:{
    station:string;nativeOverlapMm3:number;realMechanicalJointCertified:false;
  }[]}[];
  profiles:Record<Profile,QualityRecord>;
  mechanicalG2:'HOLD';
};
export type RearJointSource={
  manifest:RearJointManifest;profile:Profile;glbBytes:ArrayBuffer;fileName:string;
};

/** Source-manifest-integrity gate, NOT independent OEM or chassis attestation.
 * P2.13 is a separate eight-body optional visual; it replaces four old
 * bearing proxies ONLY when the P2.12 19-source mesh is also imported.
 */
export function readRearJointManifest(value:unknown):RearJointManifest {
  if(!value||typeof value!=='object')
    throw Error('Missing P2.13 authored source manifest');
  const m=value as Partial<RearJointManifest>;
  const proxy=m.replaceAnnularProxies;
  if(m.schema!==P213_SCHEMA || m.unitsCad!=='mm'||m.unitsGLB!=='m' ||
    m.newCadSolids!==8 || m.replacedOldCadSolids!==4 ||
    m.candidateCombinedCadSolids!==23 || m.stepRoundtripSolids!==8 ||
    !validSHA(m.masterSTEPsha256) || !idsEqual(m.newCadPartIds,P213_PARTS) ||
    !proxy || Object.keys(proxy).length!==4 ||
    !STATIONS.every((key,i)=>proxy[key]===P213_REPLACED_BEARING_PARTS[i]) ||
    !m.sourceCadFileSha256 || Object.keys(m.sourceCadFileSha256).length!==5 ||
    !SOURCES.every(key=>validSHA(m.sourceCadFileSha256?.[key])) ||
    !Number.isFinite(m.nominalSphericalRadialGapMm??NaN) ||
    Math.abs((m.nominalSphericalRadialGapMm??0)-.3)>1e-6 ||
    m.sphericalBallRetainedCertified!==false ||
    m.actualSphericalArticulationCertified!==false ||
    m.chassisHardpointsMeasured!==false ||
    m.wholeCarClearanceCertified!==false ||
    m.continuousSweptCollisionCertified!==false ||
    m.mechanicalG2!=='HOLD')
    throw Error('P2.13 source lineage, 8-solid identity or G2 certification flags invalid');
  const audit=m.combinedNominalStaticAudit;
  if(!audit || audit.pairCount!==253 ||
    !Number.isSafeInteger(audit.aabbExcluded) ||
    !Number.isSafeInteger(audit.nativeBrepIntersectionsEvaluated) ||
    audit.aabbExcluded<0 || audit.nativeBrepIntersectionsEvaluated<0 ||
    audit.aabbExcluded+audit.nativeBrepIntersectionsEvaluated!==253 ||
    audit.unresolvedCollisions?.length!==0 || audit.booleanErrors?.length!==0 ||
    audit.passStatic!==true || audit.dynamicKinematicsCertified!==false)
    throw Error('P2.13 must include all 253 nominal 23-body static native CAD pair classifications');
  const angles=[-180,-90,-45,0,45,90,180];
  if(m.poseCount!==7 || JSON.stringify(m.anglesDeg)!==JSON.stringify(angles) ||
    !Array.isArray(m.poseReviews) || m.poseReviews.length!==7 ||
    !m.poseReviews.every((row,i)=>
      row.angleDeg===angles[i] && row.jointCount===4 &&
      idsEqual(row.cases?.map(j=>j.station),STATIONS) &&
      row.cases.every(j=>Number.isFinite(j.nativeOverlapMm3) &&
        j.nativeOverlapMm3<=.02 && j.realMechanicalJointCertified===false)))
    throw Error('P2.13 requires all 28 native joint pair pose reviews');
  if(!m.profiles || !TIERS.every(q=>{
    const row=m.profiles?.[q];
    return !!row && typeof row.file==='string' && row.file.length>0 &&
      validSHA(row.sha256) &&
      Number.isSafeInteger(row.bytes) && row.bytes>0 && row.bytes<15*1024*1024 &&
      Number.isSafeInteger(row.triangles) && row.triangles>0 &&
      row.meshCount===8 && row.allWatertight===true;
  }))throw Error('P2.13 lacks three SHA-linked 8-node watertight GLBs');
  return m as RearJointManifest;
}
export async function verifyRearJointSource(value:unknown,file:File):Promise<RearJointSource> {
  const manifest=readRearJointManifest(value);
  const profile=TIERS.find(t=>manifest.profiles[t].file===file.name);
  if(!profile)throw Error('P2.13 GLB filename not in CAD manifest');
  const info=manifest.profiles[profile];
  if(file.size!==info.bytes)throw Error('P2.13 original GLB byte count mismatch');
  const bytes=await file.arrayBuffer();
  checkGlb(bytes);
  if(await sha256(bytes)!==info.sha256.toLowerCase())
    throw Error('P2.13 original GLB SHA-256 mismatch');
  return {manifest,profile,glbBytes:bytes,fileName:file.name};
}
