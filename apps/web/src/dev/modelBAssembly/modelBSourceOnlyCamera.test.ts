import {describe,expect,it} from 'vitest';
import {
 sourceOnlyModelBCamera,type ShowroomBounds,
} from './modelBSourceOnlyCamera';

const original:ShowroomBounds=[[-13.8963,-1.6,-5.0],[13.8963,1.6,5.0]];
const scale=.17357287237986882;
describe('Original Model B six-chapter camera WITHOUT private P2.8 source',()=>{
 it('uses the original GLB world bounds in metres, not guessed four wheel centres',()=>{
   const pose=sourceOnlyModelBCamera(original,scale,.05);
   expect(pose.geometrySource).toBe('OWNER_MODEL_B_GLTF_BOUNDS');
   expect(pose.rearMechanicalMateCertified).toBe(false);
   expect(pose.targetM[0]).toBeCloseTo(0,8);
   expect(pose.distanceM).toBeGreaterThan(8);
 });
 it('changes actual source-derived camera at all six scroll chapters',()=>{
   const samples=[.06,.23,.39,.57,.75,.94];
   const poses=samples.map(p=>sourceOnlyModelBCamera(original,scale,p));
   const signatures=poses.map(s=>JSON.stringify([s.targetM,s.distanceM,s.orbit]));
   expect(new Set(signatures).size).toBe(6);
   expect(poses[2].targetM[0]).toBeGreaterThan(0);
   expect(poses[4].targetM[0]).toBeLessThan(0);
   expect(poses[5].targetM[0]).toBeCloseTo(0,6);
 });
 it('full-car source-only final view is finite, widescreen and mobile',()=>{
   for(const aspect of [0.5,.7,1,16/9,21/9]){
     const pose=sourceOnlyModelBCamera(original,scale,1,aspect);
     expect(pose.targetM.every(Number.isFinite)).toBe(true);
     expect(Number.isFinite(pose.distanceM)).toBe(true);
     expect(pose.distanceM).toBeGreaterThan(3);
   }
   expect(sourceOnlyModelBCamera(original,scale,.95,.5).distanceM)
     .toBeGreaterThan(sourceOnlyModelBCamera(original,scale,.95,16/9).distanceM);
 });
 it('rejects invented bounds, wrong orientation and nonfinite numbers',()=>{
   expect(()=>sourceOnlyModelBCamera(original,0,.2)).toThrow();
   expect(()=>sourceOnlyModelBCamera(original,scale,NaN)).toThrow();
   expect(()=>sourceOnlyModelBCamera([[0,0,0],[0,1,1]],scale,.5)).toThrow();
   expect(()=>sourceOnlyModelBCamera([[0,0,0],[4,9,7]],1,.5)).toThrow();
   expect(()=>sourceOnlyModelBCamera([[0,0,0],[40,2,2]],1,.5)).toThrow();
 });
});
