import assert from 'node:assert/strict';
import {test} from 'node:test';
import sharp from 'sharp';
import {
 analyzeModelBFrame,assertModelBFrameVisible,modelBFrameDifference,
} from './model-b-frame-audit.mjs';

async function fixture({width=128,height=96,rect}={}){
 const base=sharp({create:{width,height,channels:3,background:'#080e18'}});
 if(!rect)return base.png().toBuffer();
 const overlay=await sharp({create:{
  width:rect.width,height:rect.height,channels:3,
  background:rect.color??'#f9b87d',
 }}).png().toBuffer();
 return base.composite([{input:overlay,left:rect.x,top:rect.y}])
  .png().toBuffer();
}
test('a background-only WebGL canvas never passes vehicle visibility',async()=>{
 const audit=await analyzeModelBFrame(await fixture());
 assert.equal(audit.foregroundPixels,0);
 assert.equal(audit.bounds,null);
 assert.throws(()=>assertModelBFrameVisible(audit),/not visibly rendered/);
});
test('a source vehicle shape produces measured nonbackground bounds',async()=>{
 const audit=await analyzeModelBFrame(await fixture({
  rect:{x:20,y:22,width:76,height:45},
 }));
 assert.equal(audit.foregroundPixels,3420);
 assert(Math.abs(audit.bounds.width-76/128)<1e-9);
 assert(Math.abs(audit.bounds.height-45/96)<1e-9);
 assertModelBFrameVisible(audit,{finalFrame:true});
});
test('a single lit pixel cannot masquerade as a rendered vehicle',async()=>{
 const audit=await analyzeModelBFrame(await fixture({
  rect:{x:30,y:20,width:1,height:1},
 }));
 assert.throws(()=>assertModelBFrameVisible(audit),/not visibly rendered/);
});
test('final frame rejects narrow slivers while accepting wide car silhouettes',async()=>{
 const audit=await analyzeModelBFrame(await fixture({
  rect:{x:40,y:15,width:5,height:66},
 }));
 assertModelBFrameVisible(audit);
 assert.throws(()=>assertModelBFrameVisible(audit,{finalFrame:true}),/too small/);
});
test('raw pixel difference distinguishes chapter motion from unchanged frame',async()=>{
 const first=await fixture({rect:{x:20,y:20,width:50,height:30}});
 const second=await fixture({rect:{x:55,y:36,width:50,height:30}});
 assert.equal(await modelBFrameDifference(first,first),0);
 assert((await modelBFrameDifference(first,second))>.02);
});
test('pixel comparison rejects mismatched canvas dimensions',async()=>{
 const first=await fixture({width:128,height:96});
 const second=await fixture({width:129,height:96});
 await assert.rejects(()=>modelBFrameDifference(first,second),/dimensions differ/);
});
