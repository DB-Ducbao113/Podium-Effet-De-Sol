import {describe,expect,it} from 'vitest';
import {sourceBodyMeshKey,sourceBodyMeshPhase,sourceBodyMeshSeparation,sourceBodyVisualDisplacement} from './sourceOnlyMeshMotion';

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
 it('assigns independent stable keys to duplicate or blank owner GLB mesh names',()=>{
  const keys=[sourceBodyMeshKey('',0),sourceBodyMeshKey('',1),
    sourceBodyMeshKey('Wheel',2),sourceBodyMeshKey('Wheel',3)];
  expect(new Set(keys).size).toBe(4);
  expect(keys).toEqual(['#0','#1','Wheel#2','Wheel#3']);
  expect(sourceBodyMeshPhase(keys[0])).not.toBe(sourceBodyMeshPhase(keys[1]));
  for(const key of keys){
   expect(sourceBodyMeshSeparation(0,key)).toBe(0);
   expect(sourceBodyMeshSeparation(1,key)).toBe(0);
  }
 });
 it('rejects invalid source ordinals',()=>{
  for(const ordinal of [-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1])
   expect(()=>sourceBodyMeshKey('mesh',ordinal)).toThrow(/ordinal/);
 });
 it('honours reduced motion for both source-only and CAD-present shell views',()=>{
  for(const name of names)for(let i=0;i<=100;i++){
   const progress=i/100;
   expect(sourceBodyVisualDisplacement(progress,name,false,true,.18)).toBe(0);
   expect(sourceBodyVisualDisplacement(progress,name,true,true,.18)).toBe(0);
   expect(sourceBodyVisualDisplacement(progress,name,false,false,.18))
     .toBe(sourceBodyMeshSeparation(progress,name));
   expect(sourceBodyVisualDisplacement(progress,name,true,false,.18)).toBe(.18);
  }
 });
 it('refuses nonfinite scroll input by restoring the source pose',()=>{
  for(const name of names)for(const p of [NaN,Infinity,-Infinity])
   expect(sourceBodyMeshSeparation(p,name)).toBe(0);
 });
});
