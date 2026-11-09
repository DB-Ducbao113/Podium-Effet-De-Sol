import { describe, expect, it } from 'vitest';
import {
  REAR_TOE_ALL_PARTS, REAR_TOE_NEW_PARTS, REAR_TOE_SCHEMA,
  readRearToeManifest,
} from './rearToeSource';

function fixture() {
  const parts=Object.fromEntries(REAR_TOE_ALL_PARTS.map(key=>[key,100]));
  const base={file:'P211_rear_toe_balanced.glb',bytes:10000,
    sha256:'a'.repeat(64),triangles:1500,perPartTriangles:parts,
    allNodesWatertight:true};
  return {
    schema:REAR_TOE_SCHEMA,unitsCAD:'mm',unitsGLB:'m',
    masterSTEPsha256:'b'.repeat(64),totalCadSolids:15,newSolids:4,
    newP211Parts:[...REAR_TOE_NEW_PARTS],
    sourceP29P210P211PartIds:[...REAR_TOE_ALL_PARTS],
    actualChassisToeHardpointMeasured:false,
    rootP28SourceModified:false,modelBSourceModified:false,
    mechanicalMateCertified:false,dynamicToeKinematicsCertified:false,
    toeAdjustabilityCertified:false,jointRetentionCertified:false,
    nativeStaticAudit:{pairCount:105,aabbExcluded:88,
      nativeBrepIntersectionsEvaluated:17,unresolvedCollisions:[],booleanErrors:[],
      passStatic:true,dynamicKinematicsCertified:false,jointRetentionCertified:false},
    profiles:{
      HIGH:{...base,file:'P211_rear_toe_high.glb'},
      BALANCED:base,
      PERFORMANCE:{...base,file:'P211_rear_toe_performance.glb'},
    },
  };
}
describe('P2.11 original 15-source-part toe-link contract',()=>{
  it('accepts source CAD static proposal but explicitly not chassis/dynamic approval',()=>{
    const m=readRearToeManifest(fixture());
    expect(m.totalCadSolids).toBe(15);
    expect(m.newSolids).toBe(4);
    expect(m.actualChassisToeHardpointMeasured).toBe(false);
    expect(m.dynamicToeKinematicsCertified).toBe(false);
    expect(m.mechanicalMateCertified).toBe(false);
  });
  it('refuses missing toe link or duplicate front-copy identity',()=>{
    const x=fixture();
    expect(()=>readRearToeManifest({...x,newP211Parts:x.newP211Parts.slice(1)})).toThrow(/identities/);
    expect(()=>readRearToeManifest({...x,sourceP29P210P211PartIds:
      [...x.sourceP29P210P211PartIds.slice(0,-1),x.sourceP29P210P211PartIds[0]]
    })).toThrow(/identities/);
  });
  it('fails closed on mechanical or motion certification flags',()=>{
    const x=fixture();
    expect(()=>readRearToeManifest({...x,mechanicalMateCertified:true})).toThrow(/HOLD/);
    expect(()=>readRearToeManifest({...x,actualChassisToeHardpointMeasured:true})).toThrow(/HOLD/);
    expect(()=>readRearToeManifest({...x,dynamicToeKinematicsCertified:true})).toThrow(/HOLD/);
  });
  it('requires all 105 native B-Rep pairs and source-locked GLB',()=>{
    const x=fixture();
    expect(()=>readRearToeManifest({...x,nativeStaticAudit:
      {...x.nativeStaticAudit,aabbExcluded:87}})).toThrow(/105-pair/);
    expect(()=>readRearToeManifest({...x,nativeStaticAudit:
      {...x.nativeStaticAudit,unresolvedCollisions:[{a:'x',b:'y'}]}})).toThrow(/105-pair/);
    expect(()=>readRearToeManifest({...x,profiles:{...x.profiles,BALANCED:
      {...x.profiles.BALANCED,allNodesWatertight:false}}})).toThrow(/15-node/);
    expect(()=>readRearToeManifest({...x,profiles:{...x.profiles,BALANCED:
      {...x.profiles.BALANCED,triangles:1499}}})).toThrow(/15-node/);
  });
});
