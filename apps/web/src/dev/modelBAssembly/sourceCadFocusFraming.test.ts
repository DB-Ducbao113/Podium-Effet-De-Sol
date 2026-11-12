import {describe,expect,it} from 'vitest';
import {sourceCadFocusDistance} from './sourceCadFocusFraming';

describe('P2.40 authentic source CAD camera fit',()=>{
 it('has a safe macro distance for a measured small hardware mesh',()=>{
  const distance=sourceCadFocusDistance([.018,.012,.025],1.6,35,true);
  expect(distance).toBeCloseTo(.24);
 });
 it('fits actual selected native source rim and tyre extents',()=>{
  const distance=sourceCadFocusDistance([.65,.65,.27],1.6,35,false);
  expect(distance).toBeGreaterThan(1);
  expect(distance).toBeLessThan(5);
 });
 it('fits portrait phones by increasing camera distance from same source mesh',()=>{
  const size:[number,number,number]=[.62,.40,.35];
  const desktop=sourceCadFocusDistance(size,16/9);
  const portrait=sourceCadFocusDistance(size,390/844);
  expect(portrait).toBeGreaterThan(desktop);
 });
 it('never crops source bounding sphere by violating half FOV',()=>{
  for(const aspect of [.35,.45,.65,1,1.77,2.2]){
   for(const size of [[.02,.01,.01],[.3,.2,.13],[.66,.66,.5]]){
    const distance=sourceCadFocusDistance(size as [number,number,number],
      aspect,35,true);
    const radius=Math.hypot(...size)/2;
    const halfVertical=35*Math.PI/360;
    const halfHorizontal=Math.atan(Math.tan(halfVertical)*aspect);
    const fraction=radius/distance;
    expect(fraction).toBeLessThanOrEqual(
      Math.sin(Math.min(halfVertical,halfHorizontal))/1.24+1e-12);
   }
  }
 });
 it('restores deterministic camera distance on reverse scrolling',()=>{
  const size:[number,number,number]=[.28,.14,.19];
  const original=sourceCadFocusDistance(size,.68);
  for(let i=1000;i>=0;i--)
   expect(sourceCadFocusDistance(size,.68)).toBe(original);
 });
 it('rejects zero, nonfinite and descending perspective inputs',()=>{
  for(const size of [[0,0,0],[-1,.2,.2],[NaN,.2,.2],[Infinity,1,1]])
   expect(()=>sourceCadFocusDistance(size as [number,number,number],1))
    .toThrow(/source focus/);
  for(const aspect of [0,-1,NaN,Infinity])
   expect(()=>sourceCadFocusDistance([.1,.2,.3],aspect))
    .toThrow(/source focus/);
  for(const fov of [0,5,120,200,NaN,Infinity])
   expect(()=>sourceCadFocusDistance([.1,.2,.3],1,fov))
    .toThrow(/source focus/);
 });
});
