import {describe,it,expect} from 'vitest';
import {accessibleAssemblyFraction,accessibleShellOpacity} from './accessibleAssemblyPose';

describe('P2.35E reduced-motion original CAD assembly',()=>{
 it('locks all imported CAD parts into their final authored pose',()=>{
  for(const fraction of [0,.001,.2,.5,.999,1,NaN,Infinity])
   expect(accessibleAssemblyFraction(fraction,true)).toBe(1);
 });
 it('preserves source CAD choreography without reduced motion',()=>{
  for(const fraction of [0,.01,.25,.5,.75,.99,1])
   expect(accessibleAssemblyFraction(fraction,false)).toBe(fraction);
 });
 it('clamps nonfinite or out-of-bounds authored progress',()=>{
  expect(accessibleAssemblyFraction(NaN,false)).toBe(0);
  expect(accessibleAssemblyFraction(Infinity,false)).toBe(0);
  expect(accessibleAssemblyFraction(-3,false)).toBe(0);
  expect(accessibleAssemblyFraction(4,false)).toBe(1);
 });
 it('preserves a fully opaque original shell in reduced-motion mode',()=>{
  for(const opacity of [0,.13,.78,1,NaN,Infinity])
   expect(accessibleShellOpacity(opacity,true)).toBe(1);
 });
 it('retains normal visual shell fading without reduced motion',()=>{
  for(const opacity of [0,.3,.78,1])
   expect(accessibleShellOpacity(opacity,false)).toBe(opacity);
  expect(accessibleShellOpacity(NaN,false)).toBe(1);
  expect(accessibleShellOpacity(-1,false)).toBe(0);
  expect(accessibleShellOpacity(3,false)).toBe(1);
 });
});
