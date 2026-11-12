import {describe,expect,it} from 'vitest';
import {
 cadInspectionVisualFrame,cadInspectionShellAlpha,
 cadInspectionAssemblyFraction,
} from './cadInspectionVisualFrame';

describe('P2.39 selected genuine source CAD X-ray inspection',()=>{
 it('preserves the original unselected scroll timeline appearance',()=>{
  for(let i=0;i<=1000;i++){
   const fraction=i/1000;
   const state=cadInspectionVisualFrame(fraction,false,false);
   expect(state.opacity).toBeCloseTo(Math.min(1,fraction*3),10);
   expect(state.depthWrite).toBe(fraction>.94);
   expect(state.visible).toBe(fraction>.008);
   expect(cadInspectionAssemblyFraction(fraction,false,false))
    .toBeCloseTo(fraction,10);
  }
 });
 it('selects real part fully opaque and depth-writing even early in the timeline',()=>{
  for(const fraction of [0,.01,.25,.75,1]){
   expect(cadInspectionVisualFrame(fraction,true,true))
    .toEqual({opacity:1,depthWrite:true,visible:true});
   expect(cadInspectionAssemblyFraction(fraction,true,true)).toBe(1);
  }
 });
 it('renders nonselected source parts transparent but never creates extra parts',()=>{
  for(const fraction of [0,.01,.3,.8,1]){
   const state=cadInspectionVisualFrame(fraction,true,false);
   expect(state.opacity).toBeLessThanOrEqual(.08);
   expect(state.depthWrite).toBe(false);
   expect(state.visible).toBe(fraction>.008);
   expect(cadInspectionAssemblyFraction(fraction,true,false)).toBe(fraction);
  }
 });
 it('opens original exterior in inspection, restores full material alpha when cleared',()=>{
  for(const opacity of [0,.1,.3,.78,1]){
   expect(cadInspectionShellAlpha(opacity,true)).toBeLessThanOrEqual(.14);
   expect(cadInspectionShellAlpha(opacity,false)).toBe(opacity);
  }
 });
 it('reduced motion assembled CAD stays visible and immediately focuses selected part',()=>{
  expect(cadInspectionVisualFrame(1,true,true))
   .toEqual({opacity:1,depthWrite:true,visible:true});
  expect(cadInspectionVisualFrame(1,true,false))
   .toEqual({opacity:.08,depthWrite:false,visible:true});
 });
 it('nonfinite inputs fail closed without NaN renderer material opacity',()=>{
  for(const value of [NaN,Infinity,-Infinity]){
   expect(cadInspectionShellAlpha(value,true)).toBe(0);
   expect(cadInspectionVisualFrame(value,false,false).opacity).toBe(0);
   expect(cadInspectionAssemblyFraction(value,false,false)).toBe(0);
   expect(cadInspectionAssemblyFraction(value,true,true)).toBe(1);
  }
 });
 it('keeps every original CAD material alpha in [0,1] for all frames',()=>{
  for(let i=0;i<=1000;i++){
   const fraction=i/1000;
   for(const selected of [false,true])for(const inspecting of [false,true]){
    const state=cadInspectionVisualFrame(fraction,inspecting,selected);
    expect(state.opacity).toBeGreaterThanOrEqual(0);
    expect(state.opacity).toBeLessThanOrEqual(1);
    expect(typeof state.depthWrite).toBe('boolean');
    expect(typeof state.visible).toBe('boolean');
   }
  }
 });
});
