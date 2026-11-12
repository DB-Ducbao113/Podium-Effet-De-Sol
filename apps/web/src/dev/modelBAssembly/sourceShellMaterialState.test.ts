import {describe,expect,it} from 'vitest';
import {sourceMaterialFrame} from './sourceShellMaterialState';

describe('P2.35C owner GLB multi-material transparency',()=>{
 it('restores distinct paint and glass alpha at original final pose',()=>{
  expect(sourceMaterialFrame({opacity:1,depthWrite:true},1))
   .toEqual({opacity:1,depthWrite:true});
  expect(sourceMaterialFrame({opacity:.24,depthWrite:false},1))
   .toEqual({opacity:.24,depthWrite:false});
 });
 it('preserves relative alpha while source shell is faded',()=>{
  expect(sourceMaterialFrame({opacity:.24,depthWrite:false},.8))
   .toEqual({opacity:.192,depthWrite:false});
  expect(sourceMaterialFrame({opacity:1,depthWrite:true},.8))
   .toEqual({opacity:.8,depthWrite:false});
 });
 it('never enables depth writes for original translucent no-write materials',()=>{
  for(const fade of [0,.1,.5,.93,1,2])
   expect(sourceMaterialFrame({opacity:.35,depthWrite:false},fade).depthWrite)
    .toBe(false);
 });
 it('clamps shell opacity and rejects invalid original material alpha',()=>{
  expect(sourceMaterialFrame({opacity:.4,depthWrite:true},-2).opacity).toBe(0);
  expect(sourceMaterialFrame({opacity:.4,depthWrite:true},2).opacity).toBe(.4);
  for(const opacity of [NaN,-1,1.01,Infinity])
   expect(()=>sourceMaterialFrame({opacity,depthWrite:true},1)).toThrow();
  expect(()=>sourceMaterialFrame({opacity:1,depthWrite:true},NaN)).toThrow();
 });
});
