import {describe,expect,it} from 'vitest';
import {
 advanceSourceFrameTargetEpoch,createSourceFrameTargetEpoch,
} from './sourceFrameTargetEpoch';
import {sourceFrameSettled} from './sourceFrameSettling';

const model={source:'owner Model B'},p28={source:'P2.8'},bolt={id:'real nut'};
describe('P2.50 target-change-based original CAD camera settlement',()=>{
 it('does not certify a new scroll target on the same frame it was issued',()=>{
  const epoch=createSourceFrameTargetEpoch();
  const first=advanceSourceFrameTargetEpoch(epoch,7,0,model,null);
  expect(first).toBe(7);
  expect(sourceFrameSettled({progress:0,cameraErrorM:0,frame:7},0,first))
   .toBe(false);
  expect(sourceFrameSettled({progress:0,cameraErrorM:0,frame:8},0,first))
   .toBe(false);
  expect(sourceFrameSettled({progress:0,cameraErrorM:0,frame:9},0,first))
   .toBe(true);
 });
 it('does not reset epoch while unchanged actual target remains in place',()=>{
  const epoch=createSourceFrameTargetEpoch();
  expect(advanceSourceFrameTargetEpoch(epoch,100,.535,p28,null)).toBe(100);
  for(let frame=101;frame<1000;frame++)
   expect(advanceSourceFrameTargetEpoch(epoch,frame,.535,p28,null))
    .toBe(100);
 });
 it('resets epoch on every distinct forward or reverse scroll target',()=>{
  const epoch=createSourceFrameTargetEpoch();
  const positions=[0,.22,.42,.535,.62,.735,.78,.94,.735,.535,.42,0];
  for(let index=0;index<positions.length;index++){
   const frame=index*5+1;
   const issued=advanceSourceFrameTargetEpoch(
     epoch,frame,positions[index],p28,null);
   expect(issued).toBe(frame);
   expect(sourceFrameSettled({
     progress:positions[index],cameraErrorM:0,frame,
   },positions[index],issued)).toBe(false);
   expect(sourceFrameSettled({
     progress:positions[index],cameraErrorM:0,frame:frame+2,
   },positions[index],issued)).toBe(true);
  }
 });
 it('invalidates a settled screenshot when original CAD is re-imported at same scroll',()=>{
  const epoch=createSourceFrameTargetEpoch();
  expect(advanceSourceFrameTargetEpoch(epoch,20,.42,model,null)).toBe(20);
  expect(advanceSourceFrameTargetEpoch(epoch,30,.42,p28,null)).toBe(30);
  expect(sourceFrameSettled({
   progress:.42,cameraErrorM:0,frame:30,
  },.42,epoch.targetIssuedFrame)).toBe(false);
 });
 it('invalidates the settled camera when the authentic CAD selection changes',()=>{
  const epoch=createSourceFrameTargetEpoch();
  const otherBolt={id:'different real source part'};
  advanceSourceFrameTargetEpoch(epoch,50,.42,p28,null);
  expect(advanceSourceFrameTargetEpoch(epoch,60,.42,p28,bolt)).toBe(60);
  expect(advanceSourceFrameTargetEpoch(epoch,61,.42,p28,bolt)).toBe(60);
  expect(advanceSourceFrameTargetEpoch(epoch,70,.42,p28,otherBolt))
   .toBe(70);
  expect(advanceSourceFrameTargetEpoch(epoch,80,.42,p28,null)).toBe(80);
 });
 it('does not conflate equal CAD ID strings on different real mesh objects',()=>{
  const epoch=createSourceFrameTargetEpoch();
  const a={id:'P28_SOURCE_BOLT'},b={id:'P28_SOURCE_BOLT'};
  advanceSourceFrameTargetEpoch(epoch,10,.5,p28,a);
  expect(advanceSourceFrameTargetEpoch(epoch,11,.5,p28,b)).toBe(11);
 });
 it('fails closed on fabricated or out-of-order frame records',()=>{
  const epoch=createSourceFrameTargetEpoch();
  for(const frame of [-1,0,NaN,Infinity,2.2])
   expect(()=>advanceSourceFrameTargetEpoch(epoch,frame,0,model,null))
    .toThrow(/source target frame/);
  for(const progress of [-.1,1.2,NaN,Infinity])
   expect(()=>advanceSourceFrameTargetEpoch(epoch,1,progress,model,null))
    .toThrow(/source target frame/);
  advanceSourceFrameTargetEpoch(epoch,20,.1,model,null);
  expect(()=>advanceSourceFrameTargetEpoch(epoch,19,.1,model,null))
   .toThrow(/went backwards/);
 });
 it('handles 10,001 actual CAD timeline steps without false old-frame certification',()=>{
  const epoch=createSourceFrameTargetEpoch();
  for(let i=0;i<=10000;i++){
   const progress=i/10000,frame=i*3+1;
   const issued=advanceSourceFrameTargetEpoch(
     epoch,frame,progress,p28,null);
   expect(issued).toBe(frame);
   expect(sourceFrameSettled({
     progress,cameraErrorM:0,frame,
   },progress,issued)).toBe(false);
   expect(sourceFrameSettled({
     progress,cameraErrorM:0,frame:frame+2,
   },progress,issued)).toBe(true);
  }
 });
});
