import {describe,expect,it} from 'vitest';
import {
 MODEL_B_CHAPTERS,chapterAt,clamp01,smoothStep,
 visualShellOpacity,exteriorSeparation,originalPartAssembly,
 rearSourceAssembly,stablePartOffset,wheelOffset,sourceMateStatus,
} from './modelBAssemblyTimeline';
describe('Original Model B source-locked scroll choreography',()=>{
 it('covers the full scroll without gaps, forward and reverse',()=>{
   expect(MODEL_B_CHAPTERS).toHaveLength(6);
   expect(MODEL_B_CHAPTERS[0].start).toBe(0);
   for(let i=1;i<MODEL_B_CHAPTERS.length;i++){
     expect(MODEL_B_CHAPTERS[i].start).toBe(MODEL_B_CHAPTERS[i-1].end);
   }
   for(let i=0;i<=1000;i++){
     const p=i/1000;
     const beat=chapterAt(p);
     expect(p).toBeGreaterThanOrEqual(beat.start);
     expect(p).toBeLessThan(beat.end);
   }
   expect(chapterAt(-4).id).toBe('reveal');
   expect(chapterAt(Infinity).id).toBe('reveal');
   expect(chapterAt(1).id).toBe('final');
 });
 it('avoids empty scene when owner P2.8 has not been imported',()=>{
   for(const p of [0,.22,.40,.67,.9,1]){
     expect(visualShellOpacity(p,false)).toBe(1);
     expect(exteriorSeparation(p,false)).toBe(0);
   }
   expect(visualShellOpacity(.50,true)).toBeLessThan(.15);
   expect(visualShellOpacity(1,true)).toBeCloseTo(1);
   expect(exteriorSeparation(.31,true)).toBeCloseTo(1);
   expect(exteriorSeparation(1,true)).toBeCloseTo(0);
 });
 it('animates source hardware individually and assembles all parts at final pose',()=>{
   const parts=[
     'P2_TYRE_SLICK_BODY','P2_RIM_FORGED_BARREL',
     'P2_UPRIGHT_MAIN','P2_HUB_DRIVE_FACE','P2_FASTENER_BOLT_01',
   ];
   for(const name of parts){
     expect(originalPartAssembly(name,.15)).toBe(0);
     expect(originalPartAssembly(name,1)).toBe(1);
     expect(stablePartOffset(name)).toBeGreaterThanOrEqual(0);
     expect(stablePartOffset(name)).toBeLessThan(.013);
   }
   expect(originalPartAssembly('P2_UPRIGHT_MAIN',.46))
     .toBeGreaterThan(originalPartAssembly('P2_TYRE_SLICK_BODY',.46));
   expect(rearSourceAssembly(.70,'toe','P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END'))
     .toBeGreaterThan(rearSourceAssembly(.70,'joint','P214_UPPER_SPLIT_RACE_POSITIVE_X'));
   expect(rearSourceAssembly(1,'toe','foo')).toBe(1);
   expect(rearSourceAssembly(1,'joint','bar')).toBe(1);
 });
 it('preserves nonmirror registration and rejects malformed interpolation',()=>{
   expect(wheelOffset('P2_TYRE_SLICK_BODY','rear')[2]).toBeLessThan(0);
   expect(wheelOffset('P2_TYRE_SLICK_BODY','front')[2]).toBeGreaterThan(0);
   expect(sourceMateStatus).toBe('VISUAL_SOURCE_REGISTRATION_ONLY_G2_HOLD');
   expect(clamp01(NaN)).toBe(0);
   expect(smoothStep(.1,.2,.1)).toBe(0);
   expect(smoothStep(.1,.2,.2)).toBe(1);
   expect(()=>smoothStep(.2,.1,.15)).toThrow(/increasing/);
 });
});
