import { describe, expect, it } from 'vitest';
import { checkGlb, FULL_CAR_SYSTEMS, readManifest } from './cadSource';
const profiles={HIGH:{file:'p28-high.glb',bytes:123,sha256:'a'.repeat(64)}};
const wholeProof={masterSTEPsha256:'f'.repeat(64),totalCadSolids:FULL_CAR_SYSTEMS.length,allRoundtripValid:true,
  staticAuditFile:'whole-car-audit.json',staticAuditSha256:'b'.repeat(64)};
const ids=Array.from({length:59},(_,i)=>'CAD_SOLID_'+String(i).padStart(2,'0'));
describe('CAD-first source identity, NOT R4.5',()=>{
  it('classifies 59 P2.8 solids as front-corner, never whole-car',()=>{
    const result=readManifest({schema:'podium-eds.p2.cad-first.full-corner.remate.v1',profiles,partIds:ids});
    expect(result.scope).toBe('front-corner');expect(result.parts).toHaveLength(59);
  });
  it('rejects incomplete P2.8 or duplicate part IDs',()=>{
    expect(()=>readManifest({schema:'podium-eds.p2.cad-first.full-corner.remate.v1',profiles,partIds:ids.slice(0,58)})).toThrow();
    expect(()=>readManifest({schema:'podium-eds.p2.cad-first.full-corner.remate.v1',profiles,partIds:[...ids.slice(0,58),ids[0]]})).toThrow();
  });
  it('does not accept incomplete whole-car evidence',()=>{
    expect(()=>readManifest({schema:'podium-eds.cad-first.full-car.v1',profiles,
      parts:[{id:'a',node:'A',system:'FRONT_WING',label:'wing'}]})).toThrow(/incomplete/);
  });
  it('requires unique semantic nodes across whole-car systems',()=>{
    const parts=FULL_CAR_SYSTEMS.map((system,i)=>({id:'id'+i,node:'node'+i,system,label:system}));
    expect(readManifest({schema:'podium-eds.cad-first.full-car.v1',profiles,...wholeProof,parts}).scope).toBe('full-car');
    expect(()=>readManifest({schema:'podium-eds.cad-first.full-car.v1',profiles,...wholeProof,parts:[...parts,{...parts[0],id:'duplicate'}]})).toThrow(/Duplicate/);
  });
  it('rejects whole-car metadata without STEP and B-Rep audit provenance',()=>{
    const parts=FULL_CAR_SYSTEMS.map((system,i)=>({id:'id'+i,node:'node'+i,system,label:system}));
    expect(()=>readManifest({schema:'podium-eds.cad-first.full-car.v1',profiles,parts})).toThrow(/provenance/);
  });
  it('rejects the old R4.5 asset manifest',()=>{
    expect(()=>readManifest({schema:'podium-eds.itm.r4.5',profiles,partIds:ids})).toThrow(/not accepted/);
  });
  it('rejects malformed GLB bytes',()=>{expect(()=>checkGlb(new ArrayBuffer(8))).toThrow();});
});
