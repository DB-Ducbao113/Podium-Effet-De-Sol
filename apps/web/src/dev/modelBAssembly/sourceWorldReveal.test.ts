import {describe,it,expect} from 'vitest';
import {
 sourceBodyWorldRevealStrength,worldDeltaToParentLocal,
} from './sourceWorldReveal';

const matrix=(x=1,y=1,z=1,translation=0)=>[
 x,0,0,0,
 0,y,0,0,
 0,0,z,0,
 translation,translation,translation,1,
];
describe('P2.37A original Model B world/parent-space reveal correctness',()=>{
 it('never separates giant source exterior chassis nodes',()=>{
  for(const extent of [2.31,4,30,1000])
   expect(sourceBodyWorldRevealStrength(extent,.5)).toBe(0);
 });
 it('gives bounded separation to verified small original GLB nodes',()=>{
  expect(sourceBodyWorldRevealStrength(0,0)).toBeCloseTo(.10);
  expect(sourceBodyWorldRevealStrength(2.3,1)).toBeCloseTo(.16);
  expect(sourceBodyWorldRevealStrength(1,.5)).toBeCloseTo(.13);
 });
 it('rejects malformed bounds and mesh identity phase',()=>{
  for(const invalid of [-.1,NaN,Infinity,-Infinity])
   expect(()=>sourceBodyWorldRevealStrength(invalid,.5)).toThrow(/bounds/);
  for(const invalid of [-.1,1.1,NaN,Infinity])
   expect(()=>sourceBodyWorldRevealStrength(1,invalid)).toThrow(/phase/);
 });
 it('leaves world delta unchanged for identity parent transforms',()=>{
  expect(worldDeltaToParentLocal([.1,.2,-.3],matrix())).toEqual([.1,.2,-.3]);
 });
 it('avoids double shell scaling: world 0.1 corresponds to local 1 at scale 0.1',()=>{
  expect(worldDeltaToParentLocal([.1,-.05,.2],matrix(10,10,10)))
   .toEqual([1,-.5,2]);
 });
 it('handles anisotropic and rotated nested GLB parent transforms',()=>{
  expect(worldDeltaToParentLocal([2,4,8],matrix(.5,.25,.125)))
   .toEqual([1,1,1]);
  // Inverse of parent yaw +90 degrees and uniform scale 2:
  const rotatedInverse=[
   0,0,.5,0,
   0,.5,0,0,
   -.5,0,0,0,
   0,0,0,1,
  ];
  expect(worldDeltaToParentLocal([1,0,0],rotatedInverse)).toEqual([0,0,.5]);
  expect(worldDeltaToParentLocal([0,0,1],rotatedInverse)).toEqual([-.5,0,0]);
 });
 it('never converts parent TRANSLATION into a mesh displacement',()=>{
  expect(worldDeltaToParentLocal([.4,.2,-.1],matrix(1,1,1,1e6)))
   .toEqual([.4,.2,-.1]);
 });
 it('rejects invalid/nonfinite inverse matrices and deltas',()=>{
  expect(()=>worldDeltaToParentLocal([1,0,0],[1,0])).toThrow(/transform/);
  expect(()=>worldDeltaToParentLocal([NaN,0,0],matrix())).toThrow(/transform/);
  const corrupt=matrix();corrupt[10]=Infinity;
  expect(()=>worldDeltaToParentLocal([1,0,0],corrupt)).toThrow(/transform/);
 });
});
