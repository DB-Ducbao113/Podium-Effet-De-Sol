import {describe,expect,it} from 'vitest';
import {modelBSourceCoverage} from './modelBSourceCoverage';

const all={originalMeshCount:8,p28MeshCount:59,p212MeshCount:19,p214MeshCount:16};

describe('P2.35F verified Model B visual-source coverage',()=>{
 it('does not count source layers before the original GLB is decoded',()=>{
  const audit=modelBSourceCoverage({...all,originalMeshCount:0});
  expect(audit.stage).toBe('WAITING_FOR_ORIGINAL');
  expect(audit.verifiedCadMeshes).toBe(0);
  expect(audit.originalVerified).toBe(false);
 });
 it('keeps source-only exterior distinct from CAD assembly',()=>{
  const audit=modelBSourceCoverage({originalMeshCount:8,p28MeshCount:0,p212MeshCount:0,p214MeshCount:0});
  expect(audit.stage).toBe('OWNER_EXTERIOR_ONLY');
  expect(audit.originalVerified).toBe(true);
  expect(audit.verifiedCadMeshes).toBe(0);
  expect(audit.rearWheelEndSourceIsFrontProxy).toBe(false);
 });
 it('requires exactly 59 decoded front-corner source meshes',()=>{
  for(const count of [58,60,NaN,Infinity,-1]){
   const audit=modelBSourceCoverage({...all,p28MeshCount:count});
   expect(audit.p28Verified).toBe(false);
   expect(audit.verifiedCadMeshes).toBe(0);
  }
  expect(modelBSourceCoverage({...all,p212MeshCount:0,p214MeshCount:0}).verifiedCadMeshes).toBe(59);
 });
 it('requires P2.8 before accepting rear CAD layers',()=>{
  const audit=modelBSourceCoverage({...all,p28MeshCount:0});
  expect(audit.p212Verified).toBe(false);
  expect(audit.p214Verified).toBe(false);
 });
 it('rejects phantom P2.14 completeness without P2.12',()=>{
  const audit=modelBSourceCoverage({...all,p212MeshCount:0});
  expect(audit.stage).toBe('FRONT_SOURCE_ONLY');
  expect(audit.verifiedCadMeshes).toBe(59);
  expect(audit.p214Verified).toBe(false);
 });
 it('tracks 78 decoded meshes while split-race input is incomplete',()=>{
  const audit=modelBSourceCoverage({...all,p214MeshCount:0});
  expect(audit.stage).toBe('PARTIAL_REAR_SOURCE');
  expect(audit.verifiedCadMeshes).toBe(78);
  expect(audit.p212Verified).toBe(true);
 });
 it('counts all 94 source CAD meshes without claiming a physical mate',()=>{
  const audit=modelBSourceCoverage(all);
  expect(audit.stage).toBe('ALL_AVAILABLE_SOURCES');
  expect(audit.verifiedCadMeshes).toBe(94);
  expect(audit.requiredCadMeshes).toBe(94);
  expect(audit.p214Verified).toBe(true);
  expect(audit.rearWheelEndSourceIsFrontProxy).toBe(true);
  expect(audit.mechanicalMateCertified).toBe(false);
  expect(audit.summary).toContain('VISUAL ONLY');
 });
 it('never interprets noninteger original source mesh count as verified',()=>{
  for(const count of [-1,NaN,Infinity,1.1])
   expect(modelBSourceCoverage({...all,originalMeshCount:count}).originalVerified)
    .toBe(false);
 });
});
