import {describe,expect,it} from 'vitest';
import {
 auditMountedCadIdentity,type MountedCadSourceIdentity,
} from './mountedCadIdentity';
import type {MountedCadPartIdentity} from './mountedCadSceneAudit';

const front=['front-positive-z','front-negative-z'] as const;
const rear=['rear-positive-z','rear-negative-z'] as const;
function expected(toe:0|15|19=0,joint:0|16=0):MountedCadSourceIdentity{
 return {
  frontP28:Array.from({length:59},(_,i)=>'P28_SOURCE_'+i),
  rearP28:Array.from({length:22},(_,i)=>'P28_SOURCE_'+i),
  rearToe:Array.from({length:toe},(_,i)=>'P212_SOURCE_'+i),
  rearJoint:Array.from({length:joint},(_,i)=>'P214_SOURCE_'+i),
 };
}
function mounted(ids:MountedCadSourceIdentity):MountedCadPartIdentity[]{
 const parts:MountedCadPartIdentity[]=[];
 for(const station of [...front,...rear]){
  for(const name of station.startsWith('front')?ids.frontP28:ids.rearP28)
   parts.push({station,kind:'p28',name});
  if(station.startsWith('rear')){
   for(const name of ids.rearToe)parts.push({station,kind:'rear-toe',name});
   for(const name of ids.rearJoint)parts.push({station,kind:'joint',name});
  }
 }
 return parts;
}
describe('P2.38C exact original Model B CAD source IDs in each mounted wheel',()=>{
 it('verifies the exact 59 original P2.8 source IDs per front and 22 genuine wheel-end proxy IDs per rear',()=>{
  const ids=expected();
  const audit=auditMountedCadIdentity(mounted(ids),ids);
  expect(audit.checkedMounts).toBe(4);
  expect(audit.checkedSourceMeshInstances).toBe(162);
  expect(audit.sourceNamesExact).toBe(true);
  expect(audit.rearP28FrontSourceProxy).toBe(true);
  expect(audit.mechanicalMateCertified).toBe(false);
 });
 it('verifies the native 19-mesh P2.12 rear source before P2.14 is present',()=>{
  const ids=expected(19,0);
  expect(auditMountedCadIdentity(mounted(ids),ids).checkedSourceMeshInstances)
   .toBe(200);
 });
 it('verifies the 15+16 replacement source IDs exactly at both rear stations',()=>{
  const ids=expected(15,16);
  expect(auditMountedCadIdentity(mounted(ids),ids).checkedSourceMeshInstances)
   .toBe(224);
 });
 it('rejects correct count but an invented source mesh ID at one front wheel',()=>{
  const ids=expected(),parts=mounted(ids);
  parts[3]={...parts[3],name:'FABRICATED_BOLT'};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/Incorrect original source CAD IDs/);
 });
 it('rejects correct count but wrong real source ID at only one rear wheel',()=>{
  const ids=expected(),parts=mounted(ids);
  const index=parts.findIndex(x=>x.station==='rear-negative-z'&&x.kind==='p28');
  parts[index]={...parts[index],name:'P28_SOURCE_30'};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/rear-negative-z/);
 });
 it('rejects a replaced old bearing proxy with the same 31-mesh count',()=>{
  const ids=expected(15,16),parts=mounted(ids);
  const index=parts.findIndex(x=>x.station==='rear-positive-z'&&x.kind==='rear-toe');
  parts[index]={...parts[index],name:'P210_OLD_BEARING_PROPOSAL'};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/Incorrect original source CAD IDs/);
 });
 it('rejects wrong P2.14 split-race ID despite having 16 meshes',()=>{
  const ids=expected(15,16),parts=mounted(ids);
  const index=parts.findIndex(x=>x.station==='rear-negative-z'&&x.kind==='joint');
  parts[index]={...parts[index],name:'P214_WRONG_RACE'};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/Incorrect original source CAD IDs/);
 });
 it('rejects malformed rear wheel-end expected ID manifest not originating in verified P2.8',()=>{
  const ids=expected();
  expect(()=>auditMountedCadIdentity(mounted(ids),{
   ...ids,rearP28:[...ids.rearP28.slice(1),'FAKE_REAR_CAD'],
  })).toThrow(/Invalid original P2.8/);
 });
 it('rejects duplicate original source IDs even when part counts match',()=>{
  const ids=expected(),parts=mounted(ids);
  parts[1]={...parts[1],name:parts[0].name};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/Duplicate mounted/);
 });
 it('rejects an exact 59-mesh front wheel deliberately mounted under the wrong station',()=>{
  const ids=expected(),parts=mounted(ids);
  parts[0]={...parts[0],station:'rear-negative-z'};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow();
 });
 it('fails closed on P2.12 15 meshes without full P2.14 replacement',()=>{
  const ids=expected(15,0);
  expect(()=>auditMountedCadIdentity(mounted(ids),ids)).toThrow(/P2.12/);
 });
 it('rejects unexpected source kinds and incomplete identities',()=>{
  const ids=expected(),parts=mounted(ids);
  parts[0]={...parts[0],kind:'ghost' as never};
  expect(()=>auditMountedCadIdentity(parts,ids)).toThrow(/Unexpected/);
  const empty=mounted(ids);empty[0]={...empty[0],name:''};
  expect(()=>auditMountedCadIdentity(empty,ids)).toThrow(/Unexpected/);
 });
});
