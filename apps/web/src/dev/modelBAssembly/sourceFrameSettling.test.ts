import {describe,expect,it} from 'vitest';
import {sourceFrameSettled} from './sourceFrameSettling';

const state=(progress:number,cameraErrorM=0,frame=100)=>({
 progress,cameraErrorM,frame,
});
describe('P2.49 original source CAD R3F frame settlement',()=>{
 it('accepts actual source progress only after a fresh frame and stable camera',()=>{
  expect(sourceFrameSettled(state(.535,.001,100),.535,97)).toBe(true);
  expect(sourceFrameSettled(state(.535,.001,100),.535,99)).toBe(false);
  expect(sourceFrameSettled(state(.535,.001,100),.535,100)).toBe(false);
 });
 it('rejects DOM scrubber at target while real scene progress still lags',()=>{
  expect(sourceFrameSettled(state(.45,.002),.535,97)).toBe(false);
  expect(sourceFrameSettled(state(.529,.002),.535,97)).toBe(false);
  expect(sourceFrameSettled(state(.531,.002),.535,97)).toBe(true);
 });
 it('rejects camera fly-through even when source scroll geometry is settled',()=>{
  expect(sourceFrameSettled(state(.535,1.4),.535,97)).toBe(false);
  expect(sourceFrameSettled(state(.535,.016),.535,97)).toBe(false);
  expect(sourceFrameSettled(state(.535,.014),.535,97)).toBe(true);
 });
 it('holds the reversed original CAD chapter until actual camera convergence',()=>{
  for(const target of [0,.22,.42,.535,.62,.735,.78,.94]){
   expect(sourceFrameSettled(state(target+.006,.02),target,80))
    .toBe(false);
   expect(sourceFrameSettled(state(target,.01,90),target,80)).toBe(true);
  }
 });
 it('never accepts fabricated source scroll fractions or invalid frame identities',()=>{
  for(const p of [-1,1.1,NaN,Infinity])
   expect(sourceFrameSettled(state(p),.535,0)).toBe(false);
  for(const camera of [-1,NaN,Infinity])
   expect(sourceFrameSettled(state(.535,camera),.535,0)).toBe(false);
  for(const frame of [-1,0,NaN,Infinity,2.5])
   expect(sourceFrameSettled(state(.535,.01,frame),.535,0)).toBe(false);
  for(const target of [-1,1.1,NaN,Infinity])
   expect(sourceFrameSettled(state(.535),target,0)).toBe(false);
 });
 it('is deterministic across 10,001 forward and reverse original CAD positions',()=>{
  for(let i=0;i<=10000;i++){
   const p=i/10000;
   expect(sourceFrameSettled(state(p,.008,i+10),p,i+7)).toBe(true);
   expect(sourceFrameSettled(state(p,.02,i+10),p,i+7)).toBe(false);
  }
  for(let i=10000;i>=0;i--){
   const p=i/10000;
   expect(sourceFrameSettled(state(p,.008,i+10),p,i+7)).toBe(true);
  }
 });
});
