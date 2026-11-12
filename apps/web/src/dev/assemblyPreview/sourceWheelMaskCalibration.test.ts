import {describe,expect,it} from 'vitest';
import {
 sourceWheelMaskHalfWidth,sourceWheelMaskThreshold,
} from './sourceWheelMaskCalibration';

describe('P2.43 source-calibrated stable original F1 wheel masks',()=>{
 it('converts authentic P2.8 tyre axial width into source GLB coordinates',()=>{
  const value=sourceWheelMaskHalfWidth(.314,.17357287237986882);
  expect(value).toBeCloseTo(1.447231,4);
  expect(value).toBeLessThan(2.5);
  expect(value).toBeGreaterThan(1.2);
 });
 it('does not over-cut large body panels next to four original F1 wheel envelopes',()=>{
  for(const scale of [.14,.17357,.21]){
   const halfWidth=sourceWheelMaskHalfWidth(.314,scale);
   expect(halfWidth).toBeLessThan(1.8);
   expect(halfWidth).toBeGreaterThan(1);
  }
 });
 it('does not infer an axial tyre width from a guessed wheel radius',()=>{
  const width=sourceWheelMaskHalfWidth(.314,.17357);
  expect(width).toBeCloseTo(.314*.8/.17357);
  expect(width).not.toBeCloseTo(1.24*1.9);
 });
 it('rejects altered P2.8 tyre thickness and nonmetric source scaling',()=>{
  for(const width of [0,.25,.35,NaN,Infinity,-Infinity])
   expect(()=>sourceWheelMaskHalfWidth(width,.17357)).toThrow(/Unverified/);
  for(const scale of [0,.1,.3,NaN,Infinity,-Infinity])
   expect(()=>sourceWheelMaskHalfWidth(.314,scale)).toThrow(/Unverified/);
 });
 it('generates deterministic source-space dither under camera orbit',()=>{
  const point:[number,number,number]=[7.43235,-1.07544,5.07737];
  const threshold=sourceWheelMaskThreshold(point);
  for(let i=0;i<1000;i++)
   expect(sourceWheelMaskThreshold(point)).toBe(threshold);
  expect(threshold).toBeGreaterThanOrEqual(0);
  expect(threshold).toBeLessThan(1);
 });
 it('retains uniform source-space dither distribution without screen jitter',()=>{
  const values=Array.from({length:10000},(_,i)=>
    sourceWheelMaskThreshold([
      i*.0043-14,Math.sin(i*.013)-1.07,Math.cos(i*.027)+5.08,
    ]));
  expect(values.every(v=>v>=0&&v<1)).toBe(true);
  const discarded=values.filter(v=>v<.5).length/values.length;
  expect(discarded).toBeGreaterThan(.43);
  expect(discarded).toBeLessThan(.57);
 });
 it('rejects malformed original Model B source points',()=>{
  for(const value of [[NaN,0,0],[0,Infinity,0],[0,0,-Infinity],[0,0]]){
   expect(()=>sourceWheelMaskThreshold(value as [number,number,number]))
    .toThrow(/Invalid original/);
  }
 });
});
