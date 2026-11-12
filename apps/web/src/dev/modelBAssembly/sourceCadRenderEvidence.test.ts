import {describe,expect,it} from 'vitest';
import {
 beginSourceCadRenderEvidence,createSourceCadRenderEvidence,
 recordSourceCadAfterRender,sourceCadRenderedPointCount,
} from './sourceCadRenderEvidence';

const geometry=(sourceCount:number,drawCount:number,start=0)=>({
 drawRange:{start,count:drawCount},
 getAttribute:(name:'position')=>name==='position'?{count:sourceCount}:undefined,
});

describe('P2.47 honest source CAD point onAfterRender evidence',()=>{
 it('does not claim rendered points from any scheduled drawRange alone',()=>{
  const evidence=createSourceCadRenderEvidence();
  beginSourceCadRenderEvidence(evidence);
  const scheduled=geometry(1100,500);
  expect(sourceCadRenderedPointCount(scheduled,.67)).toBe(500);
  expect(evidence.buildPoints).toBe(0);
  expect(evidence.drawCalls).toBe(0);
 });
 it('counts only a real selected source layer after its draw callback fires',()=>{
  const evidence=createSourceCadRenderEvidence();
  beginSourceCadRenderEvidence(evidence);
  expect(recordSourceCadAfterRender(evidence,'build',
    geometry(1100,320),.67)).toBe(320);
  expect(evidence).toEqual({
   frame:1,buildPoints:320,inspectionPoints:0,drawCalls:1,
  });
  expect(recordSourceCadAfterRender(evidence,'inspection',
    geometry(256,256),.82)).toBe(256);
  expect(evidence).toEqual({
   frame:1,buildPoints:320,inspectionPoints:256,drawCalls:2,
  });
 });
 it('never counts points outside original native GLB sampled buffer bounds',()=>{
  expect(sourceCadRenderedPointCount(geometry(7,100),1)).toBe(7);
  expect(sourceCadRenderedPointCount(geometry(7,100,5),1)).toBe(2);
  expect(sourceCadRenderedPointCount(geometry(7,100,8),1)).toBe(0);
 });
 it('refuses invisible material and empty native GPU draw requests',()=>{
  const evidence=createSourceCadRenderEvidence();
  beginSourceCadRenderEvidence(evidence);
  expect(recordSourceCadAfterRender(evidence,'build',
    geometry(256,256),0)).toBe(0);
  expect(recordSourceCadAfterRender(evidence,'build',
    geometry(256,0),.67)).toBe(0);
  expect(recordSourceCadAfterRender(evidence,'inspection',
    geometry(256,256),.005)).toBe(0);
  expect(evidence.drawCalls).toBe(0);
 });
 it('resets per-frame callback counts so stale GPU statistics cannot PASS',()=>{
  const evidence=createSourceCadRenderEvidence();
  beginSourceCadRenderEvidence(evidence);
  recordSourceCadAfterRender(evidence,'build',geometry(1100,1100),.67);
  expect(evidence.buildPoints).toBe(1100);
  beginSourceCadRenderEvidence(evidence);
  expect(evidence).toEqual({
   frame:2,buildPoints:0,inspectionPoints:0,drawCalls:0,
  });
 });
 it('reversible forward/backward CAD assembly reports only callback-visible dots',()=>{
  const evidence=createSourceCadRenderEvidence();
  for(let step=0;step<=1000;step++){
   beginSourceCadRenderEvidence(evidence);
   const fraction=step/1000;
   const count=Math.ceil(256*fraction);
   if(count>0&&fraction<1)
    recordSourceCadAfterRender(evidence,'build',
      geometry(256,count),.67);
   expect(evidence.buildPoints).toBe(fraction===1?0:count);
  }
  for(let step=1000;step>=0;step--){
   beginSourceCadRenderEvidence(evidence);
   const fraction=step/1000;
   const count=Math.ceil(256*fraction);
   if(count>0&&fraction<1)
    recordSourceCadAfterRender(evidence,'build',
      geometry(256,count),.67);
   expect(evidence.buildPoints).toBe(fraction===1?0:count);
  }
 });
 it('rejects fabricated source counts and invalid material opacity',()=>{
  for(const count of [0,-1,NaN,Infinity,2.5]){
   expect(()=>sourceCadRenderedPointCount(geometry(count,20),1))
    .toThrow(/post-render/);
  }
  for(const range of [-1,NaN,Infinity,2.5]){
   expect(()=>sourceCadRenderedPointCount(geometry(100,range),1))
    .toThrow(/post-render/);
  }
  for(const alpha of [-.1,1.1,NaN,Infinity]){
   expect(()=>sourceCadRenderedPointCount(geometry(100,20),alpha))
    .toThrow(/post-render/);
  }
  const broken={
   drawRange:{start:0,count:20},
   getAttribute:(_name:'position')=>undefined,
  };
  expect(()=>sourceCadRenderedPointCount(broken,1)).toThrow(/post-render/);
 });
 it('rejects incorrectly classified callbacks instead of treating them as hardware',()=>{
  const evidence=createSourceCadRenderEvidence();
  expect(()=>recordSourceCadAfterRender(evidence,
    'fabricated' as never,geometry(100,25),1)).toThrow(/source kind/);
 });
});
