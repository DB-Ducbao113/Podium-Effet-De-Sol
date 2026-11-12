import {describe,expect,it} from 'vitest';
import type {WheelId} from '../assemblyPreview/fourCornerLayout';
import {
 selectNativeHardwareDotParts,validateNativeCadDotsBudget,
 SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL,
 SOURCE_CAD_HARDWARE_DOT_BUDGET,SOURCE_CAD_TYRE_DOT_BUDGET,
 MAX_SOURCE_CAD_BUILD_DOT_SAMPLES,
} from './sourceCadDotSelection';

const stations:WheelId[]=[
 'front-positive-z','front-negative-z',
 'rear-positive-z','rear-negative-z',
];
type Mock={station:WheelId;kind:'p28'|'rear-toe'|'joint';name:string};
function originalParts(count=9):Mock[]{
 return stations.flatMap(station=>[
  ...Array.from({length:count},(_,i)=>({
   station,kind:'p28' as const,
   name:'P2_FASTENER_BOLT_'+String(i).padStart(2,'0'),
  })),
  {station,kind:'p28' as const,name:'P2_TYRE_SLICK_BODY'},
  {station,kind:'p28' as const,name:'P2_RIM_FORGED_BARREL'},
  {station,kind:'rear-toe' as const,name:'P2_FASTENER_SHOULD_NOT_BE_USED'},
 ]);
}
describe('P2.45 original mounted 4-wheel hardware vertex dot budget',()=>{
 it('selects at most six native P2.8 fasteners from each measured wheel',()=>{
  const source=originalParts();
  const selected=selectNativeHardwareDotParts(source);
  expect(selected).toHaveLength(24);
  for(const station of stations){
   const found=selected.filter(part=>part.station===station);
   expect(found).toHaveLength(SOURCE_CAD_HARDWARE_DOT_LIMIT_PER_WHEEL);
   expect(found.every(item=>item.kind==='p28')).toBe(true);
   expect(found.every(item=>source.includes(item))).toBe(true);
  }
 });
 it('sorts original source ID names deterministically, without generating bolts',()=>{
  const source=originalParts(10).reverse();
  const selected=selectNativeHardwareDotParts(source);
  for(const station of stations){
   expect(selected.filter(item=>item.station===station).map(x=>x.name))
    .toEqual(Array.from({length:6},(_,i)=>
      'P2_FASTENER_BOLT_'+String(i).padStart(2,'0')));
  }
  expect(source[0].station).toBe('rear-negative-z');
 });
 it('never creates fastener dots from tyre, rim or rear joint source names',()=>{
  const selected=selectNativeHardwareDotParts(originalParts(2));
  expect(selected).toHaveLength(8);
  expect(selected.every(x=>x.name.includes('FASTENER_BOLT'))).toBe(true);
 });
 it('accepts genuine mounted source stations with zero available fasteners',()=>{
  const source=originalParts(0);
  expect(selectNativeHardwareDotParts(source)).toEqual([]);
 });
 it('rejects duplicated original hardware names in the same station',()=>{
  const source=originalParts(2);
  source.push({...source[0]});
  expect(()=>selectNativeHardwareDotParts(source)).toThrow(/Duplicate/);
 });
 it('rejects fifth wheel, empty source name and unrecognized part kind',()=>{
  const source=originalParts();
  source[0]={...source[0],station:'rear-extra-z' as never};
  expect(()=>selectNativeHardwareDotParts(source)).toThrow(/Invalid/);
  const empty=originalParts();empty[0]={...empty[0],name:''};
  expect(()=>selectNativeHardwareDotParts(empty)).toThrow(/Invalid/);
  const other=originalParts();other[0]={...other[0],kind:'synthetic' as never};
  expect(()=>selectNativeHardwareDotParts(other)).toThrow(/Invalid/);
 });
 it('counts only original sampled source vertices within the GPU budget',()=>{
  const source=[...Array.from({length:4},()=>({
   sampleCount:SOURCE_CAD_TYRE_DOT_BUDGET,
  })),...Array.from({length:24},()=>({
   sampleCount:SOURCE_CAD_HARDWARE_DOT_BUDGET,
  }))];
  expect(validateNativeCadDotsBudget(source))
   .toBe(MAX_SOURCE_CAD_BUILD_DOT_SAMPLES);
  expect(MAX_SOURCE_CAD_BUILD_DOT_SAMPLES).toBe(10544);
 });
 it('rejects excessive dot layers or invalid native sample counts',()=>{
  expect(()=>validateNativeCadDotsBudget(
   Array.from({length:29},()=>({sampleCount:1}))))
   .toThrow(/draw budget/);
  for(const sampleCount of [0,-1,1101,NaN,Infinity,1.5])
   expect(()=>validateNativeCadDotsBudget([{sampleCount}]))
    .toThrow(/sampled vertex count/);
 });
 it('does not mutate mounted CAD identities or source manifest order',()=>{
  const source=originalParts(8);
  const snapshot=JSON.stringify(source);
  selectNativeHardwareDotParts(source);
  expect(JSON.stringify(source)).toBe(snapshot);
 });
});
