import {describe,expect,it,vi} from 'vitest';
import {
 sourceCadDotFrame,updateSourceCadDotRange,
} from './sourceCadDotProgress';

describe('P2.46 progressive original CAD vertex construction',()=>{
 it('starts with no source dots and reaches all genuine sampled vertices',()=>{
  expect(sourceCadDotFrame(1100,0,0))
   .toEqual({drawCount:0,opacity:0,visible:false});
  const midway=sourceCadDotFrame(1100,.32,.67);
  expect(midway.drawCount).toBe(550);
  expect(midway.visible).toBe(true);
  expect(sourceCadDotFrame(1100,.64,.5).drawCount).toBe(1100);
  expect(sourceCadDotFrame(1100,1,0))
   .toEqual({drawCount:1100,opacity:0,visible:false});
 });
 it('reverses scroll without missing or fabricating native CAD points',()=>{
  const history=Array.from({length:1001},(_,i)=>{
   const p=i/1000;
   return sourceCadDotFrame(1100,p,.67*Math.sin(Math.PI*p));
  });
  for(let i=1000;i>=0;i--){
   const p=i/1000;
   expect(sourceCadDotFrame(1100,p,.67*Math.sin(Math.PI*p)))
    .toEqual(history[i]);
  }
  for(let i=1;i<history.length;i++){
   expect(history[i].drawCount)
    .toBeGreaterThanOrEqual(history[i-1].drawCount);
   expect(history[i].drawCount).toBeLessThanOrEqual(1100);
  }
 });
 it('handles real small original fastener meshes with fewer sampled vertices',()=>{
  for(const n of [3,7,32,128,256]){
   const first=sourceCadDotFrame(n,0,0);
   const half=sourceCadDotFrame(n,.32,.67);
   const last=sourceCadDotFrame(n,.64,.25);
   expect(first.drawCount).toBe(0);
   expect(half.drawCount).toBe(Math.ceil(n/2));
   expect(last.drawCount).toBe(n);
  }
 });
 it('never shows construction points during X-ray or Reduce Motion',()=>{
  for(const fraction of [0,.1,.3,.65,.9,1]){
   const frame=sourceCadDotFrame(256,fraction,0);
   expect(frame.visible).toBe(false);
   expect(frame.opacity).toBe(0);
  }
 });
 it('changes actual viewer-owned drawRange without changing source GLB vertices',()=>{
  const geometry={
   drawRange:{start:0,count:0},
   setDrawRange:vi.fn(function(this:{drawRange:{start:number;count:number}},
     start:number,count:number){this.drawRange={start,count};}),
  };
  expect(updateSourceCadDotRange(geometry,0)).toBe(false);
  expect(updateSourceCadDotRange(geometry,100)).toBe(true);
  expect(updateSourceCadDotRange(geometry,100)).toBe(false);
  expect(updateSourceCadDotRange(geometry,256)).toBe(true);
  expect(updateSourceCadDotRange(geometry,0)).toBe(true);
  expect(geometry.setDrawRange).toHaveBeenCalledTimes(3);
  expect(geometry.drawRange).toEqual({start:0,count:0});
 });
 it('runs through repeated source and reverse timeline transitions without GPU reallocation',()=>{
  const geometry={
   drawRange:{start:0,count:0},calls:0,
   setDrawRange(start:number,count:number){
    this.drawRange={start,count};this.calls++;
   },
  };
  for(let repeat=0;repeat<8;repeat++){
   for(let i=0;i<=1000;i++)
    updateSourceCadDotRange(geometry,
     sourceCadDotFrame(256,i/1000,.6).drawCount);
   for(let i=1000;i>=0;i--)
    updateSourceCadDotRange(geometry,
     sourceCadDotFrame(256,i/1000,.6).drawCount);
  }
  expect(geometry.drawRange).toEqual({start:0,count:0});
  expect(geometry.calls).toBeGreaterThan(0);
  expect(geometry.calls).toBeLessThan(16016);
 });
 it('fails closed on invalid source data and malformed GPU draw ranges',()=>{
  for(const count of [0,-1,30001,NaN,Infinity,1.5])
   expect(()=>sourceCadDotFrame(count,.5,.4)).toThrow(/source CAD/);
  for(const fraction of [-1,1.1,NaN,Infinity])
   expect(()=>sourceCadDotFrame(256,fraction,.4)).toThrow(/source CAD/);
  for(const alpha of [-.1,1.1,NaN,Infinity])
   expect(()=>sourceCadDotFrame(256,.5,alpha)).toThrow(/source CAD/);
  const geometry={
   drawRange:{start:0,count:0},
   setDrawRange(start:number,count:number){
    this.drawRange={start,count};
   },
  };
  for(const invalid of [-1,30001,1.5,NaN,Infinity])
   expect(()=>updateSourceCadDotRange(geometry,invalid))
    .toThrow(/source CAD/);
 });
});
