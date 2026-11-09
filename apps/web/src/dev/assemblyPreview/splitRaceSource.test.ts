import {describe,expect,it} from 'vitest';
import {P214_PARTS,SPLIT_RACE_SCHEMA,readSplitRaceManifest} from './splitRaceSource';

const stations=['UPPER','LOWER','TOE_OUTER','TOE_INNER'];
function fixture(){
 const perPartTriangles=Object.fromEntries(P214_PARTS.map(x=>[x,100]));
 const row={file:'P214_split_spherical_joints_balanced.glb',
  bytes:20000,sha256:'a'.repeat(64),triangles:1600,perPartTriangles,
  meshCount:16,allWatertight:true};
 return {
  schema:SPLIT_RACE_SCHEMA,cadUnits:'mm',glbUnits:'m',
  replacesP213SourceParts:true,
  replacesSourceBearingProxies:{
   UPPER:'P210_REAR_UPPER_OUTER_SPHERICAL_BEARING_PROPOSAL',
   LOWER:'P210_REAR_LOWER_OUTER_SPHERICAL_BEARING_PROPOSAL',
   TOE_OUTER:'P211_REAR_TOE_OUTER_BEARING_PROPOSAL',
   TOE_INNER:'P211_REAR_TOE_INNER_BEARING_PROPOSAL',
  },
  newPartNames:[...P214_PARTS],newNativeSolidCount:16,
  previousP213Solids:8,candidateCombinedSourceSolids:31,
  upstreamCadSourceSha256:Object.fromEntries([
   'p2_9_rear_upright.py','p2_10_rear_wishbone.py',
   'p2_11_rear_toe_link.py','p2_12_toe_adjuster.py',
   'p2_12_constrained_kinematics.py','p2_13_rear_joint_prototype.py',
  ].map(name=>[name,'b'.repeat(64)])),
  step:'P214_split_spherical_joint_sleeve_prototypes.step',
  stepSha256:'c'.repeat(64),stepRoundtripSolids:16,
  openingFeasibility:{
   originalOnePieceAxialInsertionPossible:false,
   halvesPlacedFromRadiallyOppositeSides:true,
   radialBallToSphericalCavityClearanceMm:.3,
   raceToSleeveRadialGapMm:.1,sleeveToOriginalEyeRadialGapMm:.12,
   axialSleeveRetentionCertified:false,pressFitDesignedOrCertified:false,
   actualPhysicalAssemblyDemonstrated:false,
  },
  discreteAssemblyPathAudit:{
   finiteInsertionPairChecks:144,positiveControlCount:4,
   maxObservedIntersectionMm3:0,
   intentionallyCollidingSphereControls:stations.map(station=>({
    station,intersectionMm3:104.022845,detected:true,
   })),
   discreteRadialAssemblyPathPass:true,
   discreteAxialSleevePlacementPass:true,continuousInsertionCertified:false,
   axialSleeveRetentionCertified:false,manufacturingAssemblyCertified:false,
   mechanicalG2:'HOLD',
  },
  nominalStaticAudit:{
   pairCount:465,aabbExcluded:400,nativeBrepIntersectionsEvaluated:65,
   unresolvedCollisions:[],booleanErrors:[],passStatic:true,
   dynamicKinematicsCertified:false,jointRetentionCertified:false,
  },
  sampledIdealPoseReviewCount:7,
  sampledIdealPoses:[-180,-90,-45,0,45,90,180].map(sleeveTurnDeg=>({
   sleeveTurnDeg,stations,
   ballCentresCoincidentWithRaceCentresByConstruction:true,
   clearanceFromExactSweptSimulationCertified:false,
  })),
  profiles:{HIGH:{...row,file:'P214_split_spherical_joints_high.glb'},
    BALANCED:row,PERFORMANCE:{...row,file:'P214_split_spherical_joints_performance.glb'}},
  axialRetentionCertified:false,assemblySequenceKinematicallyVerified:false,
  chassisHardpointsMeasured:false,dynamic31BodyCollisionCertified:false,
  nativeBearingStrengthCertified:false,mechanicalG2:'HOLD',
 };
}
describe('P2.14 16-body radial-split race CAD source',()=>{
 it('accepts 16 distinct names and 31-body source replacement with G2 HOLD',()=>{
  const m=readSplitRaceManifest(fixture());
  expect(m.newPartNames).toHaveLength(16);
  expect(m.candidateCombinedSourceSolids).toBe(31);
  expect(m.axialRetentionCertified).toBe(false);
 });
 it('rejects axial-retention claims and old one-piece-only bearings',()=>{
  const x=fixture();
  expect(()=>readSplitRaceManifest({...x,axialRetentionCertified:true})).toThrow(/HOLD/);
  expect(()=>readSplitRaceManifest({...x,openingFeasibility:{
   ...x.openingFeasibility,originalOnePieceAxialInsertionPossible:true,
  }})).toThrow(/opening|split/);
 });
 it('rejects missed 144 insertion tests or failed positive collision checks',()=>{
  const x=fixture();
  expect(()=>readSplitRaceManifest({...x,discreteAssemblyPathAudit:{
   ...x.discreteAssemblyPathAudit,finiteInsertionPairChecks:143,
  }})).toThrow(/144/);
  expect(()=>readSplitRaceManifest({...x,discreteAssemblyPathAudit:{
   ...x.discreteAssemblyPathAudit,
   intentionallyCollidingSphereControls:x.discreteAssemblyPathAudit
    .intentionallyCollidingSphereControls.map(row=>({...row,intersectionMm3:0})),
  }})).toThrow(/collision/);
 });
 it('rejects bad 465 pair audit, source digest, or 16-mesh GLB',()=>{
  const x=fixture();
  expect(()=>readSplitRaceManifest({...x,nominalStaticAudit:{
   ...x.nominalStaticAudit,aabbExcluded:399,
  }})).toThrow(/465/);
  expect(()=>readSplitRaceManifest({...x,
   upstreamCadSourceSha256:{...x.upstreamCadSourceSha256,
     'p2_12_toe_adjuster.py':'bad'}})).toThrow(/hash/);
  expect(()=>readSplitRaceManifest({...x,profiles:{...x.profiles,
   BALANCED:{...x.profiles.BALANCED,meshCount:15}}})).toThrow(/16 mesh/);
 });
});
