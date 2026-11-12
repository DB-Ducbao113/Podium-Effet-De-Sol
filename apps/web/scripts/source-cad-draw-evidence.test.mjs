import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSourceCadDrawEvidence} from './source-cad-draw-evidence.mjs';

const valid=(override={})=>({
 scheduled:450,scheduledVisible:320,scheduledInspection:0,
 rendered:320,renderedInspection:0,drawCalls:2,frame:23,
 evidence:'OBSERVED',...override,
});

test('P2.47 accepts only actual original-source CAD render callbacks',()=>{
 assert.deepEqual(assertSourceCadDrawEvidence(valid(),{requireBuild:true}),
  valid());
});

test('P2.47 rejects a requested drawRange without any real render callback',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  rendered:0,drawCalls:0,evidence:'PENDING',
 }),{requireBuild:true}),/render-callback/);
});

test('P2.47 rejects a visible CAD drawRange that was never drawn',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  rendered:0,drawCalls:0,evidence:'PENDING',
 })),/render-callback/);
});

test('P2.47 accepts a properly empty nonconstruction chapter',()=>{
 assert.deepEqual(assertSourceCadDrawEvidence(valid({
  scheduled:0,scheduledVisible:0,rendered:0,
  drawCalls:0,evidence:'PENDING',
 })),valid({scheduled:0,scheduledVisible:0,rendered:0,
  drawCalls:0,evidence:'PENDING'}));
});

test('P2.47 rejects absent canvas attributes instead of Number(null) == 0',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({frame:NaN})),
  /render-callback/);
 assert.throws(()=>assertSourceCadDrawEvidence(valid({rendered:NaN})),
  /render-callback/);
 assert.throws(()=>assertSourceCadDrawEvidence(valid({evidence:undefined})),
  /render-callback/);
});

test('P2.47 rejects more rendered source vertices than visible native drawRange',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({rendered:321})),
  /render-callback/);
 assert.throws(()=>assertSourceCadDrawEvidence(valid({scheduledVisible:451})),
  /render-callback/);
});

test('P2.47 rejects bogus original hardware point budgets and draw calls',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  scheduled:10545,scheduledVisible:10450,rendered:10450,
 })),/render-callback/);
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  drawCalls:30,
 })),/render-callback/);
});

test('P2.47 X-ray source points cannot be included in a build chapter',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  renderedInspection:256,scheduledInspection:256,
 })),/render-callback/);
});

test('P2.47 rejects contradicted post-render evidence status',()=>{
 assert.throws(()=>assertSourceCadDrawEvidence(valid({evidence:'PENDING'})),
  /render-callback/);
 assert.throws(()=>assertSourceCadDrawEvidence(valid({
  drawCalls:0,
 })),/render-callback/);
});

test('P2.47 repeated source builds retain valid real callback bounds',()=>{
 for(let frame=1;frame<=10000;frame++){
  const visible=Math.floor((frame%1000)*.5);
  const observed=visible>0?visible:0;
  const dots=valid({
   frame,scheduled:500,scheduledVisible:visible,
   rendered:observed,drawCalls:observed>0?1:0,
   evidence:observed>0?'OBSERVED':'PENDING',
  });
  assert.equal(assertSourceCadDrawEvidence(dots).rendered,observed);
 }
});
