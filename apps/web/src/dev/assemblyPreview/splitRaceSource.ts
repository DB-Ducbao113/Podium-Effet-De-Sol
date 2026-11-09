import {checkGlb,sha256,type Profile} from '../cadFirstScroll/cadSource';

export const SPLIT_RACE_SCHEMA='podium-eds.p214.split-race-radial-assembly.v1';
const STATIONS=['UPPER','LOWER','TOE_OUTER','TOE_INNER'] as const;
const TIERS:Profile[]=['HIGH','BALANCED','PERFORMANCE'];
const SOURCES=['p2_9_rear_upright.py','p2_10_rear_wishbone.py',
 'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
 'p2_12_constrained_kinematics.py','p2_13_rear_joint_prototype.py'];
export const P214_PARTS=STATIONS.flatMap(s=>[
 'P214_'+s+'_SPLIT_RACE_POSITIVE_X',
 'P214_'+s+'_SPLIT_RACE_NEGATIVE_X',
 'P214_'+s+'_DRILLED_SPHERICAL_BALL',
 'P214_'+s+'_SLIDING_RETENTION_SLEEVE',
]);
type LOD={file:string;bytes:number;sha256:string;triangles:number;
 perPartTriangles:Record<string,number>;meshCount:16;allWatertight:true};
export type SplitRaceManifest={
 schema:typeof SPLIT_RACE_SCHEMA;cadUnits:'mm';glbUnits:'m';
 replacesSourceBearingProxies:Record<string,string>;replacesP213SourceParts:true;
 newPartNames:string[];newNativeSolidCount:16;previousP213Solids:8;
 candidateCombinedSourceSolids:31;upstreamCadSourceSha256:Record<string,string>;
 ownCadSourceSha256:string;
 step:string;stepSha256:string;stepRoundtripSolids:16;
 openingFeasibility:{
  originalOnePieceAxialInsertionPossible:false;
  halvesPlacedFromRadiallyOppositeSides:true;
  radialBallToSphericalCavityClearanceMm:number;
  raceToSleeveRadialGapMm:number;sleeveToOriginalEyeRadialGapMm:number;
  axialSleeveRetentionCertified:false;pressFitDesignedOrCertified:false;
  actualPhysicalAssemblyDemonstrated:false;
 };
 discreteAssemblyPathAudit:{
  finiteInsertionPairChecks:144;positiveControlCount:4;
  maxObservedIntersectionMm3:number;
  intentionallyCollidingSphereControls:{
    station:string;intersectionMm3:number;detected:true;}[];
  discreteRadialAssemblyPathPass:true;discreteAxialSleevePlacementPass:true;
  continuousInsertionCertified:false;axialSleeveRetentionCertified:false;
  manufacturingAssemblyCertified:false;mechanicalG2:'HOLD';
 };
 nominalStaticAudit:{
  pairCount:465;aabbExcluded:number;nativeBrepIntersectionsEvaluated:number;
  unresolvedCollisions:unknown[];booleanErrors:unknown[];
  passStatic:true;dynamicKinematicsCertified:false;jointRetentionCertified:false;
 };
 sampledIdealPoseReviewCount:7;
 sampledIdealPoses:{sleeveTurnDeg:number;stations:string[];
   ballCentresCoincidentWithRaceCentresByConstruction:true;
   clearanceFromExactSweptSimulationCertified:false;}[];
 profiles:Record<Profile,LOD>;
 axialRetentionCertified:false;assemblySequenceKinematicallyVerified:false;
 chassisHardpointsMeasured:false;dynamic31BodyCollisionCertified:false;
 nativeBearingStrengthCertified:false;mechanicalG2:'HOLD';
};
export type SplitRaceSource={
 manifest:SplitRaceManifest;profile:Profile;glbBytes:ArrayBuffer;fileName:string;
};
const validHash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/i.test(v);
const names=(x:unknown,expected:readonly string[])=>
 Array.isArray(x)&&x.length===expected.length&&new Set(x).size===expected.length&&
 x.every(k=>typeof k==='string'&&expected.includes(k));
const angles=[-180,-90,-45,0,45,90,180];
const proxies={
 UPPER:'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 LOWER:'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
 TOE_OUTER:'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
 TOE_INNER:'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
};
export function readSplitRaceManifest(v:unknown):SplitRaceManifest{
 if(!v||typeof v!=='object')throw Error('P2.14 original manifest missing');
 const m=v as Partial<SplitRaceManifest>;
 if(m.schema!==SPLIT_RACE_SCHEMA||m.cadUnits!=='mm'||m.glbUnits!=='m'||
   m.replacesP213SourceParts!==true||m.newNativeSolidCount!==16||
   m.previousP213Solids!==8||m.candidateCombinedSourceSolids!==31||
   m.stepRoundtripSolids!==16||!validHash(m.stepSha256)||
   !names(m.newPartNames,P214_PARTS)||
   !m.replacesSourceBearingProxies||Object.keys(m.replacesSourceBearingProxies).length!==4||
   !STATIONS.every(k=>m.replacesSourceBearingProxies?.[k]===proxies[k])||
   !validHash(m.ownCadSourceSha256)||
   !m.upstreamCadSourceSha256||Object.keys(m.upstreamCadSourceSha256).length!==6||
   !SOURCES.every(k=>validHash(m.upstreamCadSourceSha256?.[k]))||
   m.axialRetentionCertified!==false||
   m.assemblySequenceKinematicallyVerified!==false||
   m.chassisHardpointsMeasured!==false||m.dynamic31BodyCollisionCertified!==false||
   m.nativeBearingStrengthCertified!==false||m.mechanicalG2!=='HOLD')
   throw Error('P2.14 16-body CAD identity or source hash / G2 HOLD mismatch');
 const o=m.openingFeasibility;
 if(!o||o.originalOnePieceAxialInsertionPossible!==false||
   o.halvesPlacedFromRadiallyOppositeSides!==true||
   !Number.isFinite(o.radialBallToSphericalCavityClearanceMm)||
   Math.abs(o.radialBallToSphericalCavityClearanceMm-.3)>1e-5||
   Math.abs(o.raceToSleeveRadialGapMm-.1)>1e-5||
   Math.abs(o.sleeveToOriginalEyeRadialGapMm-.12)>1e-5||
   o.axialSleeveRetentionCertified!==false||o.pressFitDesignedOrCertified!==false||
   o.actualPhysicalAssemblyDemonstrated!==false)
   throw Error('P2.14 bearing split insertion clearance invalid');
 const p=m.discreteAssemblyPathAudit;
 if(!p||p.finiteInsertionPairChecks!==144||p.positiveControlCount!==4||
   !Number.isFinite(p.maxObservedIntersectionMm3)||p.maxObservedIntersectionMm3>.01||
   p.discreteRadialAssemblyPathPass!==true||
   p.discreteAxialSleevePlacementPass!==true||
   p.continuousInsertionCertified!==false||
   p.axialSleeveRetentionCertified!==false||
   p.manufacturingAssemblyCertified!==false||p.mechanicalG2!=='HOLD'||
   !names(p.intentionallyCollidingSphereControls?.map(x=>x.station),STATIONS)||
   !p.intentionallyCollidingSphereControls.every(x=>x.detected===true&&x.intersectionMm3>50))
   throw Error('P2.14 missing 144 assembly samples or four collision-positive controls');
 const a=m.nominalStaticAudit;
 if(!a||a.pairCount!==465||
   !Number.isSafeInteger(a.aabbExcluded)||
   !Number.isSafeInteger(a.nativeBrepIntersectionsEvaluated)||
   a.aabbExcluded<0||a.nativeBrepIntersectionsEvaluated<0||
   a.aabbExcluded+a.nativeBrepIntersectionsEvaluated!==465||
   a.unresolvedCollisions?.length!==0||a.booleanErrors?.length!==0||
   a.passStatic!==true||a.dynamicKinematicsCertified!==false||
   a.jointRetentionCertified!==false)
   throw Error('P2.14 31-body native source requires 465 static pairs');
 if(m.sampledIdealPoseReviewCount!==7||
   !Array.isArray(m.sampledIdealPoses)||m.sampledIdealPoses.length!==7||
   !m.sampledIdealPoses.every((row,i)=>row.sleeveTurnDeg===angles[i]&&
     names(row.stations,STATIONS)&&
     row.ballCentresCoincidentWithRaceCentresByConstruction===true&&
     row.clearanceFromExactSweptSimulationCertified===false))
   throw Error('P2.14 original seven ideal source poses missing');
 if(!m.profiles||!TIERS.every(t=>{
   const row=m.profiles?.[t];
   return !!row&&typeof row.file==='string'&&row.file.length>0&&
     Number.isSafeInteger(row.bytes)&&row.bytes>0&&row.bytes<25e6&&
     validHash(row.sha256)&&row.meshCount===16&&row.allWatertight===true&&
     Number.isSafeInteger(row.triangles)&&row.triangles>0&&
     !!row.perPartTriangles&&names(Object.keys(row.perPartTriangles),P214_PARTS)&&
     Object.values(row.perPartTriangles).every(n=>Number.isSafeInteger(n)&&n>0)&&
     Object.values(row.perPartTriangles).reduce((s,n)=>s+n,0)===row.triangles;
 }))throw Error('P2.14 missing source-locked 16 mesh HIGH/BALANCED/PERFORMANCE profiles');
 return m as SplitRaceManifest;
}
export async function verifySplitRaceSource(v:unknown,file:File):Promise<SplitRaceSource>{
 const manifest=readSplitRaceManifest(v);
 const tier=TIERS.find(t=>manifest.profiles[t].file===file.name);
 if(!tier)throw Error('P2.14 GLB name not in source manifest');
 const row=manifest.profiles[tier];
 if(file.size!==row.bytes)throw Error('P2.14 GLB byte count mismatch');
 const bytes=await file.arrayBuffer();checkGlb(bytes);
 if(await sha256(bytes)!==row.sha256.toLowerCase())throw Error('P2.14 SHA-256 mismatch');
 return {manifest,profile:tier,glbBytes:bytes,fileName:file.name};
}
