import {describe,expect,it} from 'vitest';
import {
 auditMountedCadScene,type MountedCadPartIdentity,
} from './mountedCadSceneAudit';

const front=['front-positive-z','front-negative-z'] as const;
const rear=['rear-positive-z','rear-negative-z'] as const;
function fixture(
 rearProxy=22,toe:0|15|19=0,joint:0|16=0,
):MountedCadPartIdentity[]{
 const result:MountedCadPartIdentity[]=[];
 for(const station of front)for(let i=0;i<59;i++)
  result.push({station,kind:'p28',name:'P28_FRONT_'+i});
 for(const station of rear){
  for(let i=0;i<rearProxy;i++)
   result.push({station,kind:'p28',name:'P28_REAR_PROXY_'+i});
  for(let i=0;i<toe;i++)
   result.push({station,kind:'rear-toe',name:'P212_TOE_'+i});
  for(let i=0;i<joint;i++)
   result.push({station,kind:'joint',name:'P214_JOINT_'+i});
 }
 return result;
}
describe('P2.38B source-instantiated Model B four-wheel CAD scene audit',()=>{
 it('verifies all four P2.8 wheel stations without claiming certified rear suspension',()=>{
  const audit=auditMountedCadScene(fixture());
  expect(audit.stations).toBe(4);
  expect(audit.frontP28PerStation).toBe(59);
  expect(audit.rearFrontSourceProxyPerStation).toBe(22);
  expect(audit.mountedMeshInstances).toBe(162);
  expect(audit.rearUsesFrontSourceWheelEndProxy).toBe(true);
  expect(audit.mechanicalMateCertified).toBe(false);
 });
 it('accepts intact P2.12 19-mesh native previews before P2.14 exists',()=>{
  const audit=auditMountedCadScene(fixture(22,19,0));
  expect(audit.rearToePerStation).toBe(19);
  expect(audit.rearJointPerStation).toBe(0);
  expect(audit.mountedMeshInstances).toBe(200);
 });
 it('verifies complete 31-per-rear replacement and the true mounted mesh count',()=>{
  const audit=auditMountedCadScene(fixture(22,15,16));
  expect(audit.rearToePerStation).toBe(15);
  expect(audit.rearJointPerStation).toBe(16);
  expect(audit.mountedMeshInstances).toBe(224);
  expect(audit.genuineRearSuspensionAvailable).toBe(false);
  expect(audit.mechanicalMateCertified).toBe(false);
 });
 it('rejects missing front P2.8 parts despite a valid manifest',()=>{
  const parts=fixture();parts.splice(0,1);
  expect(()=>auditMountedCadScene(parts)).toThrow(/Front original CAD/);
 });
 it('rejects asymmetric rear P2.8 proxy meshes',()=>{
  const parts=fixture();const index=parts.findIndex(part=>
   part.station==='rear-negative-z'&&part.kind==='p28');
  parts.splice(index,1);
  expect(()=>auditMountedCadScene(parts)).toThrow(/proxies mismatch/);
 });
 it('rejects P2.14 race parts until all four P2.12 placeholders are replaced',()=>{
  expect(()=>auditMountedCadScene(fixture(22,19,16))).toThrow(/incomplete/);
  expect(()=>auditMountedCadScene(fixture(22,0,16))).toThrow(/incomplete/);
 });
 it('rejects incomplete or asymmetric rear toe and split-race sets',()=>{
  const wrong=fixture(22,15,16);
  const index=wrong.findIndex(part=>part.station==='rear-positive-z'&&
    part.kind==='joint');
  wrong.splice(index,1);
  expect(()=>auditMountedCadScene(wrong)).toThrow(/incomplete/);
 });
 it('rejects duplicate source identity and unknown station',()=>{
  const parts=fixture();
  parts.push({...parts[0]});
  expect(()=>auditMountedCadScene(parts)).toThrow(/Duplicate/);
  const invalid=fixture();
  invalid[0]={...invalid[0],station:'other' as never};
  expect(()=>auditMountedCadScene(invalid)).toThrow(/Invalid/);
 });
});
