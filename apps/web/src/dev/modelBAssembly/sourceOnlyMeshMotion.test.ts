import {describe,expect,it} from 'vitest';
import {sourceBodyMeshPhase,sourceBodyMeshSeparation} from './sourceOnlyMeshMotion';

const names=[
 'MODEL_B_BODY_LEFT','MODEL_B_BODY_RIGHT','MODEL_B_FRONT_WING',
 'MODEL_B_REAR_WING','MODEL_B_COCKPIT',
];

describe('P2.35B source-only original Model B mesh staging',()=>{
 it('holds the original source pose at first and final scroll frames',()=>{
  for(const name of names){
   expect(sourceBodyMeshSeparation(0,name)).toBe(0);
   expect(sourceBodyMeshSeparation(.84,name)).toBe(0);
   expect(sourceBodyMeshSeparation(1,name)).toBe(0);
  }
 });
 it('holds separated original mesh positions during core chapters',()=>{
  for(const name of names)
   expect(sourceBodyMeshSeparation(.5,name)).toBeCloseTo(.7);
 });
 it('is stable and produces distinct phases from original mesh IDs',()=>{
  const phases=names.map(sourceBodyMeshPhase);
  expect(phases).toEqual(names.map(sourceBodyMeshPhase));
  expect(new Set(phases).size).toBeGreaterThanOrEqual(3);
 });
 it('does not move all original mesh nodes simultaneously',()=>{
  const amounts=names.map(name=>sourceBodyMeshSeparation(.24,name).toFixed(6));
  expect(new Set(amounts).size).toBeGreaterThanOrEqual(3);
 });
 it('supports reverse scroll and keeps every frame inside the visual cap',()=>{
  for(const name of names)for(let i=0;i<=1000;i++){
   const progress=i/1000;
   const amount=sourceBodyMeshSeparation(progress,name);
   expect(amount).toBeGreaterThanOrEqual(0);
   expect(amount).toBeLessThanOrEqual(.7+1e-9);
   expect(amount).toBe(sourceBodyMeshSeparation(progress,name));
  }
 });
 it('refuses nonfinite scroll input by restoring the source pose',()=>{
  for(const name of names)for(const p of [NaN,Infinity,-Infinity])
   expect(sourceBodyMeshSeparation(p,name)).toBe(0);
 });
});
