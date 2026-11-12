import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EDITORIAL_TEAM_TONES, EDITORIAL_TEAM_SIGNATURES } from './DirectorySurfaces';

const css = readFileSync('src/components/directory/directoryPaletteV6.css','utf8');

describe('PEDS V6 directory palette — prototype reference',()=>{
  it('covers all 11 constructor identities without replacing standings data',()=>{
    expect(Object.keys(EDITORIAL_TEAM_TONES)).toHaveLength(11);
    expect(EDITORIAL_TEAM_TONES.mclaren).toBe('#e89c5b');
    expect(EDITORIAL_TEAM_TONES.ferrari).toBe('#c55d50');
    expect(EDITORIAL_TEAM_TONES.mercedes).toBe('#5cae9b');
    expect(EDITORIAL_TEAM_TONES.redbull).toBe('#536e93');
    expect(EDITORIAL_TEAM_TONES.astonmartin).toBe('#639b89');
    expect(Object.keys(EDITORIAL_TEAM_SIGNATURES).sort()).toEqual(
      Object.keys(EDITORIAL_TEAM_TONES).sort(),
    );
    expect(new Set(Object.values(EDITORIAL_TEAM_SIGNATURES).map(x=>x.paper)).size).toBe(11);
    expect(new Set(Object.values(EDITORIAL_TEAM_SIGNATURES).map(x=>x.deep)).size).toBe(11);
    expect(EDITORIAL_TEAM_SIGNATURES.ferrari.accent).toBe('#ffe500');
    expect(EDITORIAL_TEAM_SIGNATURES.mclaren.accent).toBe('#47c7fc');
    expect(EDITORIAL_TEAM_SIGNATURES.audi.accent).toBe('#f50537');
    expect(EDITORIAL_TEAM_SIGNATURES.cadillac.accent).toBe('#d4af37');
    expect(EDITORIAL_TEAM_SIGNATURES.haas.accent).toBe('#e6002b');
  });

  it('uses warm paper for Teams and charcoal team-colored portraits for Drivers',()=>{
    for(const token of ['#efede7','#e4e0d8','#171b19','#151b19',
      '#e2dfd7','#d6d6ce','#ebe9e2','#121514','#d16a49',
      '.p5-team-card-body::before','.p5-driver-card--directory .p5-driver-card-visual'])
      expect(css).toContain(token);
    expect(css).toContain('var(--peds-dir-team');
    expect(css).toContain('var(--peds-dir-driver');
    expect(css).toContain('var(--peds-dir-paper');
    expect(css).toContain('var(--peds-dir-deep');
    expect(css).toContain('var(--peds-dir-accent');
    expect(css).not.toContain('nth-child(3n+2)');
  });

  it('preserves image color, keyboard focus, mobile layout and reduced motion',()=>{
    expect(css).toContain('.p5-team-card--garage .p5-team-card-art img {filter:none;}');
    expect(css).toContain('filter:none;');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media(max-width:690px)');
    expect(css).toContain('@media(max-width:380px)');
    expect(css).toContain("@media(prefers-reduced-motion:reduce)");
    expect(css).toContain("@media(forced-colors:active)");
  });
});
