import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sampleV5Item, sampleV5Scene } from './homeV5Choreography';

describe('Home V5.1 scroll transitions', () => {
  it('replaces opacity-only caption swaps with reversible directional wipes',()=>{
    const first=sampleV5Scene(0),mid=sampleV5Scene(.48),last=sampleV5Scene(1);
    expect(first.firstX).toBe(0);
    expect(first.secondX).toBeGreaterThan(0);
    expect(mid.firstX).toBeLessThan(-100);
    expect(mid.secondX).toBe(0);
    expect(mid.secondMaskRight).toBe(0);
    expect(mid.photo2Opacity).toBeGreaterThan(.5);
    expect(mid.photo2Clip).toBe(0);
    expect(last.secondX).toBeLessThan(-100);
    expect(last.thirdX).toBe(0);
    expect(last.thirdMask).toBe(0);
    expect(last.photo3Opacity).toBeGreaterThan(.5);
    expect(last.photo3Clip).toBe(0);
    expect(sampleV5Scene(-3)).toEqual(first);
    expect(sampleV5Scene(3)).toEqual(last);
  });

  it('scrubs every card, heading, image and number without changing its value',()=>{
    for(const kind of ['left','right','rise','number','wipe-left','wipe-right'] as const){
      const before=sampleV5Item(1400,900,kind);
      const after=sampleV5Item(100,900,kind);
      expect(before.progress).toBe(0);
      expect(after.progress).toBe(1);
      expect(after.alpha).toBe(1);
      expect(after.x).toBe(0);
      expect(after.y).toBe(0);
      expect(after.left+after.right+after.bottom).toBe(0);
      expect(sampleV5Item(1400,900,kind)).toEqual(before);
    }
    expect(sampleV5Item(1400,900,'left',true).x).toBe(-26);
    expect(sampleV5Item(1400,900,'left').x).toBe(-92);
    expect(sampleV5Item(1400,900,'number').bottom).toBe(95);
    // Below -> visible -> above -> visible -> below, both directions.
    for (const kind of ['left','right','rise','number','wipe-left','wipe-right'] as const) {
      const before=sampleV5Item(1400,900,kind,false,120);
      const inside=sampleV5Item(170,900,kind,false,120);
      const past=sampleV5Item(-420,900,kind,false,120);
      expect(before.progress).toBe(0);
      expect(inside.progress).toBe(1);
      expect(past.progress).toBe(0);
      expect(past.exit).toBe(1);
      expect(sampleV5Item(170,900,kind,false,120)).toEqual(inside);
      expect(sampleV5Item(1400,900,kind,false,120)).toEqual(before);
    }
  });

  it('keeps the implementation scoped to Home and retains real repo assets',()=>{
    const home=readFileSync('src/components/home/HomeView.tsx','utf8');
    const hero=readFileSync('src/components/home/PodiumBrandHero.tsx','utf8');
    const hook=readFileSync('src/components/home/useHomeV5Choreography.ts','utf8');
    const css=readFileSync('src/components/home/homeCinematicV5.css','utf8');
    expect(home).toContain('useHomeV5Choreography(homeRef)');
    expect(home).not.toContain('ModelBShowroom');
    expect(hero).toContain('<HomeRacePulseScene />');
    expect(hero).toContain('/images/home/explore/engineering.webp');
    expect(hero).toContain('/images/home/explore/drivers.webp');
    for(const token of ['race-control','championship-overview','eds-explore','prefers-reduced-motion'])
      expect(hook).toContain(token);
    expect(css).toContain('object-fit: contain');
    expect(css).toContain('home-title-fight');
    expect(css).toContain('animation:none!important');
    expect(css).not.toMatch(/scale\(1\.[2-9]/);
  });
});
