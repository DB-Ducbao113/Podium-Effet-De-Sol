import {describe,expect,it} from 'vitest';
import {
 MODEL_B_CHAPTERS,chapterAt,clamp01,smoothStep,
 visualShellOpacity,exteriorSeparation,originalPartAssembly,
 rearSourceAssembly,stablePartOffset,wheelOffset,sourceMateStatus,
 originalBodySourceOnlySeparation,originalPartAssemblyAtStation,
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
   expect(visualShellOpacity(.50,true)).toBeGreaterThanOrEqual(.78);
   expect(visualShellOpacity(1,true)).toBeCloseTo(1);
   expect(exteriorSeparation(.31,true)).toBeLessThanOrEqual(.18);
   expect(exteriorSeparation(.31,true)).toBeGreaterThan(0);
   expect(exteriorSeparation(.60,true)).toBe(0);
   expect(exteriorSeparation(1,true)).toBeCloseTo(0);
 });
 it('P2.35A source-only original mesh travels, settles and reverses deterministically',()=>{
   expect(originalBodySourceOnlySeparation(0)).toBe(0);
   expect(originalBodySourceOnlySeparation(.12)).toBe(0);
   expect(originalBodySourceOnlySeparation(.30)).toBeCloseTo(.70);
   expect(originalBodySourceOnlySeparation(.50)).toBeCloseTo(.70);
   expect(originalBodySourceOnlySeparation(.75))
     .toBeGreaterThan(0);
   expect(originalBodySourceOnlySeparation(.75))
     .toBeLessThan(.70);
   expect(originalBodySourceOnlySeparation(.84)).toBe(0);
   expect(originalBodySourceOnlySeparation(1)).toBe(0);
   expect(originalBodySourceOnlySeparation(Number.NaN)).toBe(0);
   for(let i=0;i<=100;i++){
     const fraction=originalBodySourceOnlySeparation(i/100);
     expect(fraction).toBeGreaterThanOrEqual(0);
     expect(fraction).toBeLessThanOrEqual(.70);
   }
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
   expect(originalPartAssembly('P2_HUB_DRIVE_FACE',.57))
     .toBeGreaterThan(originalPartAssembly('P2_RIM_FORGED_BARREL',.57));
   expect(originalPartAssembly('P2_RIM_FORGED_BARREL',.68))
     .toBeGreaterThan(originalPartAssembly('P2_TYRE_SLICK_BODY',.68));
   expect(visualShellOpacity(.85,true)).toBeGreaterThan(.98);
   expect(rearSourceAssembly(.70,'toe','P212_TOE_OUTER_RIGHT_HAND_THREADED_ROD_END'))
     .toBeGreaterThan(rearSourceAssembly(.70,'joint','P214_UPPER_SPLIT_RACE_POSITIVE_X'));
   expect(rearSourceAssembly(1,'toe','foo')).toBe(1);
   expect(rearSourceAssembly(1,'joint','bar')).toBe(1);
 });
 it('P2.42 offsets original four wheel stations in an explicit sequential source order',()=>{
   const tyre='P2_TYRE_SLICK_BODY';
   const stations=[
     'front-positive-z','front-negative-z',
     'rear-positive-z','rear-negative-z',
   ] as const;
   const frames=stations.map(station=>originalPartAssemblyAtStation(tyre,.735,station));
   expect(frames[0]).toBeGreaterThan(frames[1]);
   expect(frames[1]).toBeGreaterThan(frames[2]);
   expect(frames[2]).toBeGreaterThan(frames[3]);
   for(const station of stations){
     expect(originalPartAssemblyAtStation(tyre,0,station)).toBe(0);
     expect(originalPartAssemblyAtStation(tyre,.85,station)).toBe(1);
     expect(originalPartAssemblyAtStation(tyre,1,station)).toBe(1);
   }
 });
 it('P2.42 guarantees four-wheel scroll reversibility and bounds without moving source CAD',()=>{
   const tyre='P2_TYRE_SLICK_BODY',bolt='P2_FASTENER_BOLT_01';
   const stations=[
     'front-positive-z','front-negative-z',
     'rear-positive-z','rear-negative-z',
   ] as const;
   for(const name of [tyre,bolt])for(const station of stations)
     for(let i=1000;i>=0;i--){
       const p=i/1000;
       const fraction=originalPartAssemblyAtStation(name,p,station);
       expect(fraction).toBeGreaterThanOrEqual(0);
       expect(fraction).toBeLessThanOrEqual(1);
       expect(fraction).toBe(originalPartAssemblyAtStation(name,p,station));
     }
 });
 it('P2.42 rejects unknown source wheel stations instead of generating a phantom fifth corner',()=>{
   expect(()=>originalPartAssemblyAtStation('P2_TYRE_SLICK_BODY',.5,
     'rear-other-z' as never)).toThrow(/Unknown original Model B/);
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
