import {describe,it,expect} from 'vitest';
import {
 sourceMeshOwnWorldBounds,sourceBodyWorldRevealStrength,
} from './sourceWorldReveal';

const identity=[
 1,0,0,0,
 0,1,0,0,
 0,0,1,0,
 0,0,0,1,
] as const;
const rotated=[
 0,1,0,0,
 -1,0,0,0,
 0,0,1,0,
 5,-3,2,1,
] as const;
const bounds=(min:[number,number,number],max:[number,number,number],
 matrix:ArrayLike<number>=identity)=>
 sourceMeshOwnWorldBounds(min,max,matrix);

describe('P2.37C authentic source geometry bounds exclude GLB descendants',()=>{
 it('uses exact authored local bounds with identity source matrix',()=>{
  expect(bounds([-1,-2,-3],[1,2,3])).toEqual({
   center:[0,0,0],size:[2,4,6],diagonal:Math.hypot(2,4,6),
  });
 });
 it('handles GLB world translation and a 90-degree rotation',()=>{
  const value=bounds([-1,-2,-3],[1,2,3],rotated);
  expect(value.center).toEqual([5,-3,2]);
  expect(value.size).toEqual([4,2,6]);
  expect(value.diagonal).toBeCloseTo(Math.sqrt(56));
 });
 it('handles the real owner shell scaling without duplicating parent scale',()=>{
  const shell=.17357287237986882;
  const scaled=[shell,0,0,0,0,shell,0,0,0,0,shell,0,0,0,0,1];
  const big=bounds([-15,-1,-2],[15,1,2],scaled);
  expect(big.diagonal).toBeGreaterThan(2.3);
  expect(sourceBodyWorldRevealStrength(big.diagonal,.5)).toBe(0);
  const small=bounds([-.2,-.1,-.1],[.2,.1,.1],scaled);
  expect(sourceBodyWorldRevealStrength(small.diagonal,.5)).toBeCloseTo(.13);
 });
 it('equals independent eight-corner projection for shear and reflection',()=>{
  const matrix=[1.2,.2,-.5,0, .1,-.7,.3,0, -.4,.5,1.9,0, 5,-4,2,1];
  const lower:[number,number,number]=[-.2,-2,-3];
  const upper:[number,number,number]=[.8,1,5];
  const projected=[[],[],[]] as number[][];
  for(const x of [lower[0],upper[0]])
   for(const y of [lower[1],upper[1]])
    for(const z of [lower[2],upper[2]]){
     projected[0].push(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12]);
     projected[1].push(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13]);
     projected[2].push(matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]);
    }
  const box=bounds(lower,upper,matrix);
  for(let axis=0;axis<3;axis++){
   const lo=Math.min(...projected[axis]),hi=Math.max(...projected[axis]);
   expect(box.center[axis]).toBeCloseTo((lo+hi)/2,10);
   expect(box.size[axis]).toBeCloseTo(hi-lo,10);
  }
 });
 it('rejects invalid, descending and nonfinite source geometry bounds',()=>{
  expect(()=>bounds([1,0,0],[0,1,1])).toThrow(/world bounds/);
  expect(()=>bounds([0,0,NaN],[1,1,1])).toThrow(/world bounds/);
  expect(()=>bounds([0,0,0],[Infinity,1,1])).toThrow(/world bounds/);
 });
 it('rejects invalid projective or nonfinite world matrices',()=>{
  expect(()=>bounds([0,0,0],[1,1,1],[1,2])).toThrow(/world bounds/);
  const projective=[...identity];projective[3]=.5;
  expect(()=>bounds([0,0,0],[1,1,1],projective)).toThrow(/world bounds/);
  const corrupt=[...identity];corrupt[14]=NaN;
  expect(()=>bounds([0,0,0],[1,1,1],corrupt)).toThrow(/world bounds/);
 });
});
