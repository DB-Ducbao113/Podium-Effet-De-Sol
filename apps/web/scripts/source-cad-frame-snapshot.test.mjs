import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSourceCadFrameSnapshot} from './source-cad-frame-snapshot.mjs';

const baseline=overrides=>({
 frame:103,targetIssuedFrame:100,sceneProgress:.535,cameraErrorM:.008,
 settled:'true',scheduledVisible:100,rendered:100,drawCalls:1,
 evidence:'OBSERVED',...overrides,
});
const options={targetProgress:.535,previousFrame:99,requireNewTarget:true};

test('accepts one settled genuine source CAD camera/render frame',()=>{
 const snapshot=baseline({});
 assert.strictEqual(assertSourceCadFrameSnapshot(snapshot,options),snapshot);
});
test('rejects previous source frame that was settled before a new target',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  targetIssuedFrame:98,
 }),options),/not settled/);
});
test('rejects a camera settled in a frame before two fresh source renders',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  frame:101,
 }),options),/not settled/);
});
test('rejects a 3D source camera still moving after DOM scroll reached goal',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  cameraErrorM:.030,
 }),options),/not settled/);
});
test('rejects actual scene progress lag hidden by a settled DOM scrubber',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  sceneProgress:.525,
 }),options),/not settled/);
});
test('rejects pending source point renders even if scheduled CAD dots exist',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  rendered:0,drawCalls:0,evidence:'PENDING',
 }),options),/not settled/);
});
test('rejects impossible original GPU callback dot counts',()=>{
 assert.throws(()=>assertSourceCadFrameSnapshot(baseline({
  rendered:101,
 }),options),/not settled/);
});
test('allows truly empty original CAD points in a completed final scene',()=>{
 const snapshot=baseline({
  scheduledVisible:0,rendered:0,drawCalls:0,evidence:'PENDING',
 });
 assert.strictEqual(assertSourceCadFrameSnapshot(snapshot,options),snapshot);
});
test('refuses missing actual source-epoch frame number or camera telemetry',()=>{
 for(const invalid of [NaN,Infinity,-1,1.2]){
  assert.throws(()=>assertSourceCadFrameSnapshot(
   baseline({targetIssuedFrame:invalid}),options),/not settled/);
  assert.throws(()=>assertSourceCadFrameSnapshot(
   baseline({cameraErrorM:invalid}),options),/not settled/);
 }
});
test('10,001 authentic original source target frames remain deterministic',()=>{
 for(let i=0;i<=10000;i++){
  const fraction=i/10000,issued=i*3+1;
  const snapshot=baseline({
   frame:issued+2,targetIssuedFrame:issued,
   sceneProgress:fraction,scheduledVisible:0,
   rendered:0,drawCalls:0,evidence:'PENDING',
  });
  assert.strictEqual(assertSourceCadFrameSnapshot(snapshot,{
   targetProgress:fraction,previousFrame:Math.max(0,issued-1),
   requireNewTarget:i>0,
  }),snapshot);
 }
});
