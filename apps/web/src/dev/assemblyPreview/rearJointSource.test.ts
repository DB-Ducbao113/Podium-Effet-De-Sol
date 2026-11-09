import {describe,expect,it} from 'vitest';
import {
  P213_SCHEMA,P213_PARTS,P213_REPLACED_BEARING_PARTS,readRearJointManifest,
} from './rearJointSource';

const stations=['UPPER','LOWER','TOE_OUTER','TOE_INNER'];
function fixture() {
  const row={file:'P213_spherical_joints_balanced.glb',sha256:'a'.repeat(64),
    triangles:3000,bytes:11000,meshCount:8,allWatertight:true};
  const sourceCadFileSha256=Object.fromEntries([
    'p2_9_rear_upright.py','p2_10_rear_wishbone.py','p2_11_rear_toe_link.py',
    'p2_12_toe_adjuster.py','p2_12_constrained_kinematics.py',
  ].map(name=>[name,'b'.repeat(64)]));
  return {
    schema:P213_SCHEMA,unitsCad:'mm',unitsGLB:'m',
    sourceCadFileSha256,
    replaceAnnularProxies:Object.fromEntries(
      stations.map((key,i)=>[key,P213_REPLACED_BEARING_PARTS[i]])),
    newCadPartIds:[...P213_PARTS],newCadSolids:8,
    replacedOldCadSolids:4,candidateCombinedCadSolids:23,
    stepRoundtripSolids:8,masterSTEPsha256:'c'.repeat(64),
    nominalSphericalRadialGapMm:.3,
    sphericalBallRetainedCertified:false,
    actualSphericalArticulationCertified:false,
    chassisHardpointsMeasured:false,
    wholeCarClearanceCertified:false,
    continuousSweptCollisionCertified:false,
    poseCount:7,
    anglesDeg:[-180,-90,-45,0,45,90,180],
    poseReviews:[-180,-90,-45,0,45,90,180].map(angle=>({
      angleDeg:angle,jointCount:4,
      cases:stations.map(station=>({
        station,nativeOverlapMm3:0,realMechanicalJointCertified:false,
      })),
    })),
    profiles:{
      HIGH:{...row,file:'P213_spherical_joints_high.glb'},
      BALANCED:row,
      PERFORMANCE:{...row,file:'P213_spherical_joints_performance.glb'},
    },mechanicalG2:'HOLD',
  };
}
describe('P2.13 provisional rear spherical joint source guard',()=>{
  it('requires exact 8 source identities and four explicit replacements',()=>{
    const m=readRearJointManifest(fixture());
    expect(m.newCadPartIds).toHaveLength(8);
    expect(m.replacedOldCadSolids).toBe(4);
    expect(m.candidateCombinedCadSolids).toBe(23);
  });
  it('requires 28 pose joint checks, no claimed G2 approval',()=>{
    const m=readRearJointManifest(fixture());
    expect(m.poseReviews).toHaveLength(7);
    expect(m.actualSphericalArticulationCertified).toBe(false);
    expect(()=>readRearJointManifest({
      ...fixture(),actualSphericalArticulationCertified:true,
    })).toThrow(/G2/);
    expect(()=>readRearJointManifest({
      ...fixture(),poseReviews:fixture().poseReviews.slice(1),
    })).toThrow(/28/);
  });
  it('rejects a stale/bogus source, swapped proxy, or duplicate mesh',()=>{
    const x=fixture();
    expect(()=>readRearJointManifest({
      ...x,sourceCadFileSha256:{...x.sourceCadFileSha256,
        'p2_12_toe_adjuster.py':'x'},
    })).toThrow(/lineage/);
    expect(()=>readRearJointManifest({
      ...x,newCadPartIds:[...x.newCadPartIds.slice(1),x.newCadPartIds[1]],
    })).toThrow(/identity/);
    expect(()=>readRearJointManifest({
      ...x,replaceAnnularProxies:{...x.replaceAnnularProxies,UPPER:'bad'},
    })).toThrow(/lineage/);
  });
  it('rejects positive race-ball overlap and missing LOD integrity',()=>{
    const x=fixture();
    const altered=structuredClone(x);
    altered.poseReviews[0].cases[0].nativeOverlapMm3=1.2;
    expect(()=>readRearJointManifest(altered)).toThrow(/28/);
    expect(()=>readRearJointManifest({
      ...x,profiles:{...x.profiles,HIGH:{...x.profiles.HIGH,allWatertight:false}},
    })).toThrow(/watertight/);
  });
});
