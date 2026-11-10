import {describe,expect,it} from 'vitest';
import {frameOriginalModelB,originalModelBFitsFrame} from './modelBFraming';

const owner=([
 [-13.8963,-3.0,-5.65],
 [ 13.8963,2.8703,5.8777],
] as const);
const scale=.17357287237986882;
describe('Original owner Model B final full-car framing from GLB vertices',()=>{
 it('fits all eight ORIGINAL source extrema into actual portrait 390×844 viewport',()=>{
  const aspect=390/844;
  const frame=frameOriginalModelB(owner,scale,aspect);
  expect(frame.source).toBe('OWNER_MODEL_B_GLB_BOUNDS');
  expect(frame.mechanicalMateCertified).toBe(false);
  expect(originalModelBFitsFrame(owner,scale,aspect,35,frame)).toBe(true);
  expect(frame.distanceM).toBeGreaterThan(8);
 });
 it('also fits 1440×900, 1920×1080 and other real screen dimensions',()=>{
  for(const [w,h] of [[390,844],[375,812],[768,1024],[1440,900],[1920,1080]]){
   const aspect=w/h;
   const frame=frameOriginalModelB(owner,scale,aspect,35,[.88,.44,1]);
   expect(originalModelBFitsFrame(owner,scale,aspect,35,frame)).toBe(true);
   expect(frame.targetM.every(Number.isFinite)).toBe(true);
   expect(frame.distanceM).toBeLessThan(50);
  }
  const mobile=frameOriginalModelB(owner,scale,390/844);
  const desktop=frameOriginalModelB(owner,scale,1920/1080);
  expect(mobile.distanceM).toBeGreaterThan(desktop.distanceM);
 });
 it('rejects made-up F1 bodies, degenerate bounds and invalid direction',()=>{
  expect(()=>frameOriginalModelB([[0,0,0],[.1,.5,.4]],1,1)).toThrow();
  expect(()=>frameOriginalModelB([[0,0,0],[0,2,5]],1,1)).toThrow();
  expect(()=>frameOriginalModelB(owner,scale,0)).toThrow();
  expect(()=>frameOriginalModelB(owner,scale,1,35,[0,0,0])).toThrow();
 });
});
