import {describe,expect,it} from 'vitest';
import {REAR_TOE_ADJUSTER_ALL_PARTS} from '../assemblyPreview/rearToeAdjusterSource';
import {P214_PARTS} from '../assemblyPreview/splitRaceSource';
import {P213_REPLACED_BEARING_PARTS} from '../assemblyPreview/rearJointSource';
import {visibleInFourCornerPreview} from '../assemblyPreview/fourCornerLayout';
import {filterOriginalCadCatalog,originalCadPartCatalog} from './cadPartCatalog';

const p28=[
 'P2_TYRE_SLICK_BODY','P2_RIM_FORGED_BARREL',
 'P2_FASTENER_BOLT_01','P2_UPRIGHT_MAIN',
 ...Array.from({length:55},(_,i)=>'P28_SOURCE_'+i),
];

describe('Original CAD assembly click catalog from exact source manifests',()=>{
 it('enumerates two genuine front wheel ends and rear source proxies without invention',()=>{
  const catalog=originalCadPartCatalog(p28,null,null);
  const front=catalog.filter(x=>x.inspector.wheelStation.startsWith('front-'));
  const rear=catalog.filter(x=>x.inspector.wheelStation.startsWith('rear-'));
  expect(front).toHaveLength(118);
  const count=p28.filter(id=>visibleInFourCornerPreview(id,'rear')).length;
  expect(rear).toHaveLength(2*count);
  expect(rear.every(x=>x.inspector.sourceWheelEndIsRearProxy)).toBe(true);
  expect(catalog.some(x=>x.inspector.partId==='INVENTED_ENGINE')).toBe(false);
  expect(new Set(catalog.map(x=>x.key)).size).toBe(catalog.length);
 });
 it('adds 31 rear native source meshes per side and drops four annuli',()=>{
  const catalog=originalCadPartCatalog(
   p28,REAR_TOE_ADJUSTER_ALL_PARTS,P214_PARTS);
  const rears=catalog.filter(x=>x.inspector.origin!=='p28');
  expect(rears).toHaveLength(62);
  expect(rears.filter(x=>x.inspector.origin==='joint')).toHaveLength(32);
  expect(rears.filter(x=>x.inspector.origin==='rear-toe')).toHaveLength(30);
  expect(rears.every(x=>!x.inspector.mechanicalMateCertified)).toBe(true);
  for(const name of P213_REPLACED_BEARING_PARTS){
   expect(catalog.find(x=>x.inspector.partId===name)).toBeUndefined();
  }
  expect(filterOriginalCadCatalog(catalog,{
   station:'rear-positive-z',query:'P214_',
  },50)).toHaveLength(16);
  const fastener=filterOriginalCadCatalog(catalog,{
   station:'front-positive-z',query:'P2_FASTENER_BOLT_01',
  });
  expect(fastener).toHaveLength(1);
  expect(fastener[0].inspector.subsystem).toContain('Fastener');
 });
 it('rejects duplicated source ID, invalid rear source, and bad pagination',()=>{
  expect(()=>originalCadPartCatalog(p28.slice(0,58),null,null)).toThrow(/59/);
  expect(()=>originalCadPartCatalog([...p28.slice(0,58),p28[0]],
   null,null)).toThrow(/59/);
  expect(()=>originalCadPartCatalog(p28,null,P214_PARTS)).toThrow(/require/);
  expect(()=>originalCadPartCatalog(
   p28,REAR_TOE_ADJUSTER_ALL_PARTS.slice(0,18),null)).toThrow(/19/);
  expect(()=>filterOriginalCadCatalog([],{
   station:'all',query:'TEST',
  },0)).toThrow(/pagination/);
 });
});
