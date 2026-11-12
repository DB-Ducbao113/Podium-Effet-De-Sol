import {describe,expect,it} from 'vitest';
import {sourceSampleIndices} from './ownerParticleSampling';

describe('Original Model B bounded GLB vertex index sampling',()=>{
 it('preserves every source vertex for small meshes',()=>{
  expect(sourceSampleIndices(4,256)).toEqual([0,1,2,3]);
 });
 it('never exceeds exact global budget for hundreds of mesh positions',()=>{
  const indices=sourceSampleIndices(400,256);
  expect(indices.length).toBe(256);
  expect(new Set(indices).size).toBe(256);
  expect(indices.at(-1)).toBe(399);
 });
 it('selects the same indices as the old cumulative scan',()=>{
  for(const count of [1,3,400,7210,100000]){
   for(const budget of [256,7200]){
    const limit=Math.min(count,budget);
    const previous:number[]=[];
    for(let i=0;i<count;i++)
     if(Math.floor((i+1)*limit/count)>Math.floor(i*limit/count))
      previous.push(i);
    expect(sourceSampleIndices(count,budget)).toEqual(previous);
   }
  }
 });
 it('handles ten million genuine source vertices without enumerating them',()=>{
  const result=sourceSampleIndices(10_000_000,7200);
  expect(result.length).toBe(7200);
  expect(result.at(-1)).toBe(9_999_999);
 });
 it('rejects invalid source counts',()=>{
  for(const count of [0,-1,Infinity,NaN,1.5,Number.MAX_SAFE_INTEGER+1])
   expect(()=>sourceSampleIndices(count,256)).toThrow();
 });
 it('rejects invalid budgets',()=>{
  for(const budget of [0,255,30001,NaN,256.5])
   expect(()=>sourceSampleIndices(400,budget)).toThrow();
 });
});
