import {describe,expect,it} from 'vitest';
import {MODEL_B_CHAPTERS} from './modelBAssemblyTimeline';
import {modelBChapterTruth} from './modelBChapterTruth';

describe('Original owner Model B no-fake CAD assembly claims',()=>{
 it('source-only stage labels all six steps as ORIGINAL source camera',()=>{
   for(const chapter of MODEL_B_CHAPTERS){
     const t=modelBChapterTruth(chapter.id,false,false,false);
     expect(t.kind).toBe('SOURCE_ONLY_CAMERA');
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
 });
});
