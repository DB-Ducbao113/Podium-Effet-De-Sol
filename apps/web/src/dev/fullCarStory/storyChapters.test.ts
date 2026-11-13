import {describe,it,expect} from 'vitest';
import {STORY_CHAPTERS,STORY_COUNT,storyAtProgress,chapterReadiness} from './storyChapters';

describe('18-chapter Model B story never invents CAD source coverage',()=>{
  it('holds 18 unique named source-first chapters with exact endpoints',()=>{
    expect(STORY_COUNT).toBe(18);
    expect(new Set(STORY_CHAPTERS.map(c=>c.id)).size).toBe(18);
    expect(STORY_CHAPTERS[0].id).toBe('hero');
    expect(STORY_CHAPTERS[17].id).toBe('finale');
    expect(STORY_CHAPTERS.map(c=>c.number)).toEqual(
      Array.from({length:18},(_,i)=>String(i).padStart(2,'0'))
    );
  });
  it('never upgrades missing internal or rear systems when P2.8 is loaded',()=>{
    for(const chapter of STORY_CHAPTERS.filter(c=>c.coverage==='missing')){
      expect(chapterReadiness(chapter,true,true)).toBe('SOURCE_MISSING');
    }
    expect(STORY_CHAPTERS.some(c=>c.id==='power-unit'&&c.coverage==='missing')).toBe(true);
    expect(STORY_CHAPTERS.some(c=>c.id==='rear-mechanics'&&c.coverage==='missing')).toBe(true);
  });
  it('requires both verified original 59-part P2.8 and metric wheel fit',()=>{
    const front=STORY_CHAPTERS.find(c=>c.id==='front-wheel')!;
    expect(chapterReadiness(front,false,false)).toBe('SOURCE_MISSING');
    expect(chapterReadiness(front,true,false)).toBe('SOURCE_MISSING');
    expect(chapterReadiness(front,false,true)).toBe('SOURCE_MISSING');
    expect(chapterReadiness(front,true,true)).toBe('P28_VISUAL_ONLY');
  });
  it('never presents a showroom exterior part as native mechanical CAD',()=>{
    const surface=STORY_CHAPTERS.find(c=>c.id==='front-aero')!;
    expect(chapterReadiness(surface,true,true)).toBe('MODEL_B_EXTERIOR');
  });
  it('keeps progress clamped with identical reversible phase output',()=>{
    expect(storyAtProgress(-100).index).toBe(0);
    expect(storyAtProgress(100).index).toBe(17);
    expect(storyAtProgress(Number.NaN).index).toBe(0);
    expect(storyAtProgress(0)).toEqual({index:0,nextIndex:1,blend:0});
    expect(storyAtProgress(1)).toEqual({index:17,nextIndex:17,blend:0});
    for(const p of [0,.034,.1234,.5,.875,1]){
      expect(storyAtProgress(p)).toEqual(storyAtProgress(p));
      const pose=storyAtProgress(p);
      expect(pose.blend).toBeGreaterThanOrEqual(0);
      expect(pose.blend).toBeLessThanOrEqual(1);
    }
  });
  it('marks every P2.8 detail as visual-only and preserves a reassembled finale',()=>{
    const p28=STORY_CHAPTERS.filter(c=>c.coverage==='front-corner');
    expect(p28.length).toBeGreaterThanOrEqual(4);
    expect(p28.every(c=>chapterReadiness(c,true,true)==='P28_VISUAL_ONLY')).toBe(true);
    expect(STORY_CHAPTERS.at(-1)?.coverage).toBe('exterior');
  });
});
