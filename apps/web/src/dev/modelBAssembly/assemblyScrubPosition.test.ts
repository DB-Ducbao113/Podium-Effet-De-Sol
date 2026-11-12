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
 it('round-trips chapter links, drag positions and wheel scrolling consistently',()=>{
  const chapters=[0,.15,.30,.50,.69,.85,1];
  const layouts=[
    {top:0,height:6500,viewport:1080},
    {top:155,height:4300,viewport:768},
    {top:1400,height:3300,viewport:640},
    {top:-250,height:250,viewport:390},
  ];
  for(const frame of layouts)for(const progress of chapters){
   const absoluteTop=assemblyScrollTop(frame.top,frame.height,
     frame.viewport,progress);
   const observed=assemblyScrollProgress(frame.top,frame.height,
     frame.viewport,absoluteTop);
   expect(observed).toBeCloseTo(progress,12);
  }
 });
 it('matches the CSS DOMRect scroll expression, including when scrolling backwards',()=>{
  const top=450,height=5700,viewport=900;
  for(let i=1000;i>=0;i--){
   const pageScroll=assemblyScrollTop(top,height,viewport,i/1000);
   const rectTop=top-pageScroll;
   const measured=assemblyScrollProgress(
     pageScroll+rectTop,height,viewport,pageScroll);
   expect(measured).toBeCloseTo(i/1000,10);
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
