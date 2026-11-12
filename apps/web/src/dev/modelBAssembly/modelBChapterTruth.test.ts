import {describe,expect,it} from 'vitest';
import {MODEL_B_CHAPTERS} from './modelBAssemblyTimeline';
import {modelBChapterTruth} from './modelBChapterTruth';

describe('Original owner Model B no-fake CAD assembly claims',()=>{
 it('blocks all six CAD chapters when source files decode but mounted source IDs fail',()=>{
   for(const chapter of MODEL_B_CHAPTERS){
     const t=modelBChapterTruth(chapter.id,true,true,true,true,false);
     expect(t.kind).toBe('CAD_SCENE_AUDIT_HOLD');
     expect(t.evidence).toContain('HOLD');
     expect(t.description).toContain('exact source-mesh identity');
     expect(t.description).not.toContain('assembly complete');
   }
 });

 it('does not claim a verified original while the GLB is still loading',()=>{
   for(const chapter of MODEL_B_CHAPTERS){
     const truth=modelBChapterTruth(chapter.id,false,false,false,false);
     expect(truth.kind).toBe('WAITING_FOR_ORIGINAL');
     expect(truth.evidence).toContain('VERIFYING');
     expect(truth.description).not.toContain('already verified');
   }
 });

 it('source-only stage labels all six steps as visual-source reveal, not CAD assembly',()=>{
   for(const chapter of MODEL_B_CHAPTERS){
     const t=modelBChapterTruth(chapter.id,false,false,false);
     expect(t.kind).toBe('SOURCE_ONLY_VISUAL_REVEAL');
     expect(t.description.length).toBeGreaterThan(30);
     expect(t.evidence.length).toBeGreaterThan(15);
     expect(t.description).not.toContain('completed mechanical mate');
   }
 });
 it('never claims absent P2.8 fasteners assemble on source-only route',()=>{
   const part=modelBChapterTruth('wheel-core',false,false,false);
   expect(part.description).toContain('require the authentic P2.8 source');
   expect(part.evidence).toContain('NOT LOADED');
   const original=modelBChapterTruth('final',false,false,false);
   expect(original.description).toContain('original');
   expect(original.description).toContain('No fabricated');
   const cutaway=modelBChapterTruth('cutaway',false,false,false);
   expect(cutaway.description).toContain('existing exterior GLB mesh nodes');
   expect(cutaway.evidence).toContain('NO CAD FASTENERS');
 });
 it('distinguishes loaded P2.8 source from missing P2.12/P2.14',()=>{
   expect(modelBChapterTruth('rear-joints',true,false,false).kind)
     .toBe('UNVERIFIED_REAR_PROPOSAL');
   expect(modelBChapterTruth('rear-joints',true,true,false).kind)
     .toBe('UNVERIFIED_REAR_PROPOSAL');
   expect(modelBChapterTruth('rear-joints',true,true,true).kind)
     .toBe('ORIGINAL_CAD_ASSEMBLY');
   expect(modelBChapterTruth('four-wheels',true,false,false).kind)
     .toBe('ORIGINAL_CAD_ASSEMBLY');
   expect(modelBChapterTruth('final',true,false,false).kind)
     .toBe('UNVERIFIED_REAR_PROPOSAL');
   expect(modelBChapterTruth('final',true,true,false).kind)
     .toBe('UNVERIFIED_REAR_PROPOSAL');
   expect(modelBChapterTruth('final',true,true,true).kind)
     .toBe('ORIGINAL_CAD_ASSEMBLY');
 });
});
