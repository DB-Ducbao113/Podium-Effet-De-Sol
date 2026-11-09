import {describe,expect,it} from 'vitest';
import { ADJUSTER_PARTS, REAR_TOE_ADJUSTER_ALL_PARTS, REAR_TOE_ADJUSTER_SCHEMA,
  REPLACED_FIXED_ROD, readToeAdjusterManifest } from './rearToeAdjusterSource';

function fixture() {
  const perPartTriangles=Object.fromEntries(REAR_TOE_ADJUSTER_ALL_PARTS.map(p=>[p,100]));
  const tier={
    file:'P212_rear_adjuster_balanced.glb',sha256:'a'.repeat(64),
    bytes:30000,triangles:1900,perPartTriangles,allNodesWatertight:true,
  };
  return {
    schema:REAR_TOE_ADJUSTER_SCHEMA,unitsCAD:'mm',unitsGLB:'m',
    partIds:[...REAR_TOE_ADJUSTER_ALL_PARTS],newPartIds:[...ADJUSTER_PARTS],
    sourcePartCount:19,newParts:5,replacedPriorPartId:REPLACED_FIXED_ROD,
    totalCadSolids:19,masterSTEPsha256:'b'.repeat(64),
    outerThreadHand:'RIGHT',innerThreadHand:'LEFT',
    externalHelicalCrestsModelled:true,pitchMm:2,
    femaleSleeveMinorRadiusMm:9.05,
    femaleThreadMajorRadiusMm:10.08,
    femaleThreadGrooveDepthMm:1.03,
    rodRootRadialClearanceMm:.2,
    threadCrestRadialClearanceMm:.46,
    sleeveOppositeHandGroovesModelled:true,
    bothLocknutFemaleGroovesModelled:true,
    nominalThreadPhaseMatched:true,
    threadedRodSpanMm:34,
    threadGeometryRevision:'P2.12-R2-BREP-GROOVED-RUNOUT',
    threadRunoutsModelled:true,
    threadRunoutRadiusMm:10.12,
    threadRunoutIntervalsMm:[[56,58.5],[77.5,80],[88,90.5],[109.3,112]],
    sourceP28Modified:false,modelBSourceModified:false,
    actualChassisToeHardpointMeasured:false,fullFemaleThreadProfileModelled:true,
    mechanicalThreadEngagementCertified:false,toeAdjustmentTravelCertified:false,
    locknutTorqueCertified:false,dynamicToeKinematicsCertified:false,
    mechanicalMateCertified:false,
    nativeStaticAudit:{
      pairCount:171,aabbExcluded:147,nativeBrepIntersectionsEvaluated:24,
      unresolvedCollisions:[],booleanErrors:[],passStatic:true,
      dynamicKinematicsCertified:false,jointRetentionCertified:false,
    },
    profiles:{
      HIGH:{...tier,file:'P212_rear_adjuster_high.glb'},
      BALANCED:tier,
      PERFORMANCE:{...tier,file:'P212_rear_adjuster_performance.glb'},
    },
  };
}
describe('P2.12 RH/LH toe adjuster source guard',()=>{
  it('accepts original 19-part source while keeping all engineering signoffs HOLD',()=>{
    const m=readToeAdjusterManifest(fixture());
    expect(m.partIds).toHaveLength(19);
    expect(m.newPartIds).toHaveLength(5);
    expect(m.fullFemaleThreadProfileModelled).toBe(true);
    expect(m.sleeveOppositeHandGroovesModelled).toBe(true);
    expect(m.bothLocknutFemaleGroovesModelled).toBe(true);
    expect(m.threadRunoutsModelled).toBe(true);
    expect(m.threadCrestRadialClearanceMm).toBeCloseTo(.46);
    expect(m.mechanicalThreadEngagementCertified).toBe(false);
    expect(m.actualChassisToeHardpointMeasured).toBe(false);
  });
  it('rejects the old fixed P2.11 toe rod being counted again',()=>{
    expect(REAR_TOE_ADJUSTER_ALL_PARTS).not.toContain(REPLACED_FIXED_ROD);
    expect(()=>readToeAdjusterManifest({...fixture(),partIds:[
      ...REAR_TOE_ADJUSTER_ALL_PARTS.slice(0,-1),REPLACED_FIXED_ROD,
    ]})).toThrow(/identities/);
  });
  it('rejects false real female thread engagement, toe travel and chassis proof',()=>{
    for(const key of ['mechanicalThreadEngagementCertified',
      'toeAdjustmentTravelCertified',
      'actualChassisToeHardpointMeasured','mechanicalMateCertified']) {
      expect(()=>readToeAdjusterManifest({...fixture(),[key]:true})).toThrow(/flags/);
    }
  });
  it('rejects incorrect thread hands, unverified clearances or incomplete BRep pairs',()=>{
    expect(()=>readToeAdjusterManifest({...fixture(),fullFemaleThreadProfileModelled:false}))
      .toThrow(/flags/);
    expect(()=>readToeAdjusterManifest({...fixture(),threadRunoutsModelled:false})).toThrow(/flags/);
    expect(()=>readToeAdjusterManifest({...fixture(),bothLocknutFemaleGroovesModelled:false}))
      .toThrow(/flags/);
    expect(()=>readToeAdjusterManifest({...fixture(),threadCrestRadialClearanceMm:-.1}))
      .toThrow(/flags/);
    expect(()=>readToeAdjusterManifest({...fixture(),outerThreadHand:'LEFT'}))
      .toThrow(/flags/);
    expect(()=>readToeAdjusterManifest({...fixture(),femaleThreadGrooveDepthMm:0}))
      .toThrow(/flags/);
    const original=fixture();
    expect(()=>readToeAdjusterManifest({...original,nativeStaticAudit:{
      ...original.nativeStaticAudit,aabbExcluded:146,
    }})).toThrow(/171-pair/);
    expect(()=>readToeAdjusterManifest({...original,profiles:{...original.profiles,
      BALANCED:{...original.profiles.BALANCED,triangles:1899},
    }})).toThrow(/19-mesh/);
  });
});
