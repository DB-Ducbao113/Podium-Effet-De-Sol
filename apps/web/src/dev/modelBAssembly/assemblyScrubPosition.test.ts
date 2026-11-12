import {describe,expect,it} from 'vitest';
import {assemblyScrollTop,assemblyScrollProgress} from './assemblyScrubPosition';

describe('P2.36 Model B direct timeline scrubbing',()=>{
 it('maps start middle and end to actual page scroll positions',()=>{
  expect(assemblyScrollTop(300,7000,1000,0)).toBe(300);
  expect(assemblyScrollTop(300,7000,1000,.5)).toBe(3300);
  expect(assemblyScrollTop(300,7000,1000,1)).toBe(6300);
 });
 it('is reversible for every keyboard range step',()=>{
  for(let i=0;i<=1000;i++){
   const progress=i/1000;
   const top=assemblyScrollTop(123,6800,900,progress);
   expect(assemblyScrollProgress(123,6800,900,top))
    .toBeCloseTo(progress,10);
  }
 });
 it('clamps progress and handles short tracks',()=>{
  expect(assemblyScrollTop(200,400,1000,-1)).toBe(200);
  expect(assemblyScrollTop(200,400,1000,2)).toBe(201);
  expect(assemblyScrollProgress(200,400,1000,1000)).toBe(1);
  expect(assemblyScrollProgress(200,400,1000,-100)).toBe(0);
 });
 it('rejects invalid track dimensions and nonfinite input',()=>{
  expect(()=>assemblyScrollTop(0,0,900,.5)).toThrow();
  expect(()=>assemblyScrollProgress(0,100,0,50)).toThrow();
  expect(()=>assemblyScrollTop(0,1000,900,NaN)).toThrow();
  expect(()=>assemblyScrollProgress(0,1000,900,Infinity)).toThrow();
 });
});
