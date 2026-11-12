import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The design specification is the owner-supplied
 * PEDS_CINEMATIC_PROTOTYPE_V5(1).html, not the older global IGNITION tokens.
 * Do not change Showroom / Engineering while the other pages are ported.
 */
const file=(path:string)=>readFileSync('src/'+path,'utf8');
const css=file('styles/prototypeColorParityV7.css');
const main=file('main.tsx');
const nav=file('components/layout/Navbar.tsx');

const hexValue=(hex:string)=>{
  const srgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  return srgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
};
const contrast=(a:string,b:string)=>{
  const [high,low]=[hexValue(a),hexValue(b)].sort((x,y)=>y-x);
  return (high+.05)/(low+.05);
};

describe('PEDS V7 prototype colour parity — scoped design system',()=>{
  it('publishes all eight canonical V5 tokens with literal original values',()=>{
    const expected={
      'night':'#121514','night-deep':'#0b0f0e','driver-field':'#151b19',
      'paper':'#efede7','paper-deep':'#e4e0d8','white':'#f7f5ef',
      'ink':'#171b19','accent':'#d16a49',
    } as const;
    for(const [name,hex] of Object.entries(expected)){
      expect(css).toContain('--peds-proto-'+name+':'+hex);
    }
    expect(contrast('#efede7','#171b19')).toBeGreaterThan(14);
    expect(contrast('#121514','#f7f5ef')).toBeGreaterThan(14);
  });

  it('is imported after V6 and never redefines global legacy IGNITION tokens',()=>{
    const v6=main.indexOf('destinationGridV6.css');
    const v7=main.indexOf('prototypeColorParityV7.css');
    expect(v6).toBeGreaterThan(-1);
    expect(v7).toBeGreaterThan(v6);
    expect(css).not.toContain('--peds-color-ignition:');
    expect(css).not.toContain('--peds-color-canvas:');
    expect(css).toContain('--peds-v6-paper:var(--peds-proto-paper)');
    expect(css).toContain('--peds-v6-stone:var(--peds-proto-paper-deep)');
  });

  it('implements the exact Night/Chalk/Ember Home scene backgrounds without scaling cars',()=>{
    expect(css).toContain('--v5-scene-two,0');
    expect(css).toContain('--v5-scene-three,0');
    expect(css).toContain(".r1-cinema--v7[data-v5-scene='2']");
    expect(css).toContain('.home-v5 .home-title-fight');
    expect(css).toContain('.home-v5 .eds-explore');
    expect(nav).toContain("hero.dataset.v5Scene === '2'");
    expect(css).not.toContain('scale(1.2');
  });

  it('keeps the intended light/dark page boundaries and unique team color system',()=>{
    for(const selector of [
      '.r1-championship .destination-v6',
      '.r1-championship .results-v6-detail',
      '.r1-championship .cal-v5__detail',
      '.r1-championship .cal-v5__world',
      '.r1-championship .p5-standings-v5',
      "data-directory-kind='teams'",
      "data-directory-kind='drivers'",
      '.peds-about-layout.peds-about--prototype',
      '.peds-footer',
    ]) expect(css).toContain(selector);
    const teams=file('components/directory/DirectorySurfaces.tsx');
    expect(teams).toContain('EDITORIAL_TEAM_SIGNATURES');
    expect(css).toContain('var(--team-paper');
    expect(css).toContain('var(--team-deep');
    expect(css).not.toContain('nth-child(3n+2)');
  });

  it('leaves 3D route styling under its old renderer and respects reduced motion',()=>{
    expect(nav).toContain("'legacy'");
    expect(nav).toContain('/showroom');
    expect(nav).toContain('/engineering');
    expect(css).toContain("data-prototype-surface='paper'");
    expect(css).toContain("data-prototype-surface='night'");
    expect(css).not.toContain('.model-b');
    expect(css).not.toContain('.engineering-anatomy');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('forced-colors:active');
    expect(css).toContain('focus-visible');
  });
});
