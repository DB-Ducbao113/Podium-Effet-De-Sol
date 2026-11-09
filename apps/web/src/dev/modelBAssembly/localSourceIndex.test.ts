import {describe,expect,it} from 'vitest';
import {AUTO_CAD_INDEX_SCHEMA,readLocalAutoCadIndex} from './localSourceIndex';
function fixture(){
 const record=(name:string,n:number)=>({
   manifestFile:'manifest.json',glbFile:'source.glb',
   originalGlbFileName:name,sha256:'a'.repeat(64),meshCount:n,profile:'BALANCED',
 });
 return {
  schema:AUTO_CAD_INDEX_SCHEMA,quality:'BALANCED',localOnlyNotDeployed:true,
  noFabricatedGeometry:true,mechanicalG2:'HOLD',
  sources:{
   p28:record('P28_remate_balanced.glb',59),
   p212:record('P212_rear_adjuster_balanced.glb',19),
   p214:record('P214_split_spherical_joints_balanced.glb',16),
  },
 };
}
describe('Original Model B local-only CAD index contract',()=>{
 it('requires all genuine 59/19/16 source counts and local restriction',()=>{
   const source=readLocalAutoCadIndex(fixture());
   expect(source.sources.p28?.meshCount).toBe(59);
   expect(source.sources.p212?.meshCount).toBe(19);
   expect(source.sources.p214?.meshCount).toBe(16);
   expect(source.localOnlyNotDeployed).toBe(true);
   expect(source.mechanicalG2).toBe('HOLD');
 });
 it('allows no source except P2.8; never invent other parts',()=>{
   const index=fixture();
   expect(readLocalAutoCadIndex({...index,sources:{p28:index.sources.p28}}).sources.p212)
     .toBeUndefined();
   expect(()=>readLocalAutoCadIndex({...index,sources:{
     p28:index.sources.p28,p214:index.sources.p214,
   }})).toThrow(/G2/);
 });
 it('rejects falsified source counts, hashes, traversal and remote URLs',()=>{
   const x=fixture();
   expect(()=>readLocalAutoCadIndex({...x,sources:{...x.sources,
     p28:{...x.sources.p28,meshCount:58}}})).toThrow(/identity/);
   expect(()=>readLocalAutoCadIndex({...x,sources:{...x.sources,
     p28:{...x.sources.p28,sha256:'bad'}}})).toThrow(/identity/);
   expect(()=>readLocalAutoCadIndex({...x,sources:{...x.sources,
     p28:{...x.sources.p28,originalGlbFileName:'../../bad.glb'}}})).toThrow(/identity/);
   expect(()=>readLocalAutoCadIndex({...x,sources:{...x.sources,
     p28:{...x.sources.p28,originalGlbFileName:'https://fake.test/F1.glb'}}}))
     .toThrow(/identity/);
 });
 it('rejects production exposure, mechanical approval and unknown sources',()=>{
   const x=fixture();
   expect(()=>readLocalAutoCadIndex({...x,localOnlyNotDeployed:false})).toThrow(/G2/);
   expect(()=>readLocalAutoCadIndex({...x,mechanicalG2:'PASS'})).toThrow(/G2/);
   expect(()=>readLocalAutoCadIndex({...x,sources:{...x.sources,
     mock:{manifestFile:'manifest.json',glbFile:'source.glb'}}})).toThrow(/G2/);
 });
});
