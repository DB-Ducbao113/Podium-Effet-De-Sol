import {describe,expect,it} from 'vitest';
import {
 SOURCE_CAD_XRAY_RENDER_ORDER,sourceCadXrayRenderLayer,sourceCadXrayFrameVerified,
} from './sourceCadXrayRenderLayer';

describe('P2.41 native CAD X-ray depth composition is reversible',()=>{
 it('renders only the selected authentic source mesh above ordinary opaque panels',()=>{
  const selected=sourceCadXrayRenderLayer(true,true,true,0);
  expect(selected.depthTest).toBe(false);
  expect(selected.renderOrder).toBe(SOURCE_CAD_XRAY_RENDER_ORDER);
  const sibling=sourceCadXrayRenderLayer(true,false,true,0);
  expect(sibling.depthTest).toBe(true);
  expect(sibling.renderOrder).toBe(0);
 });
 it('restores original CAD mesh render order and material depth-test when cleared',()=>{
  for(const depthTest of [true,false]){
   for(const renderOrder of [0,1,25,512,1000,1100]){
    const initial=sourceCadXrayRenderLayer(false,false,depthTest,renderOrder);
    sourceCadXrayRenderLayer(true,true,depthTest,renderOrder);
    const restored=sourceCadXrayRenderLayer(false,false,depthTest,renderOrder);
    expect(restored).toEqual(initial);
    expect(restored.depthTest).toBe(depthTest);
    expect(restored.renderOrder).toBe(renderOrder);
   }
  }
 });
 it('never disables depth testing for unselected CAD even while X-ray is open',()=>{
  for(const order of [0,1,12,999,1300]){
   const sibling=sourceCadXrayRenderLayer(true,false,true,order);
   expect(sibling.depthTest).toBe(true);
   expect(sibling.renderOrder).toBe(order);
  }
 });
 it('supports native GLB custom render order by placing chosen part later',()=>{
  const input=1400;
  const selected=sourceCadXrayRenderLayer(true,true,true,input);
  expect(selected.renderOrder).toBeGreaterThan(input);
  expect(sourceCadXrayRenderLayer(false,false,true,input).renderOrder)
   .toBe(input);
 });
 it('supports a genuinely non-depth-tested source material without inventing its original state',()=>{
  const selected=sourceCadXrayRenderLayer(true,true,false,0);
  expect(selected.depthTest).toBe(false);
  expect(sourceCadXrayRenderLayer(false,false,false,0).depthTest)
   .toBe(false);
 });
 it('is deterministic across forward and reverse scroll positions',()=>{
  for(let progress=0;progress<=1000;progress++){
   const original=sourceCadXrayRenderLayer(false,false,true,2);
   const selected=sourceCadXrayRenderLayer(true,true,true,2);
   const clear=sourceCadXrayRenderLayer(false,false,true,2);
   expect(original).toEqual(clear);
   expect(selected.renderOrder).toBeGreaterThan(original.renderOrder);
  }
 });
 it('only reports X-ray PASS after the selected original mesh is actually composited',()=>{
  expect(sourceCadXrayFrameVerified(true,1000,[
    {depthTest:false,depthWrite:true,opacity:1},
  ])).toBe(true);
  expect(sourceCadXrayFrameVerified(false,1000,[
    {depthTest:false,depthWrite:true,opacity:1},
  ])).toBe(false);
  expect(sourceCadXrayFrameVerified(true,1000,[])).toBe(false);
  expect(sourceCadXrayFrameVerified(true,999,[
    {depthTest:false,depthWrite:true,opacity:1},
  ])).toBe(false);
 });
 it('does not claim X-ray if any real CAD material remains occluded or invisible',()=>{
  const ok={depthTest:false,depthWrite:true,opacity:1};
  for(const bad of [
    {depthTest:true,depthWrite:true,opacity:1},
    {depthTest:false,depthWrite:false,opacity:1},
    {depthTest:false,depthWrite:true,opacity:.8},
    {depthTest:false,depthWrite:true,opacity:NaN},
  ])expect(sourceCadXrayFrameVerified(true,1000,[ok,bad])).toBe(false);
  expect(sourceCadXrayFrameVerified(true,1000,[ok,ok])).toBe(true);
 });
 it('rejects unsupported original CAD renderer state instead of corrupting materials',()=>{
  for(const order of [-1,NaN,Infinity,1.4,Number.MAX_SAFE_INTEGER]){
   expect(()=>sourceCadXrayRenderLayer(true,true,true,order))
    .toThrow(/render-layer/);
  }
  expect(()=>sourceCadXrayRenderLayer(true,true,null as never,0))
   .toThrow(/render-layer/);
 });
});
