import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeCinematicBackground } from './HomeCinematicBackground';
import { HomeRacePulseScene } from './HomeRacePulseScene';

const root = 'src/components/home';
const home = readFileSync(root + '/HomeView.tsx', 'utf8');
const hero = readFileSync(root + '/PodiumBrandHero.tsx', 'utf8');
const background = readFileSync(root + '/HomeCinematicBackground.tsx', 'utf8');

describe('Homepage V8 — V7 DOM contract and AEROCORE rendering', () => {
  it('keeps one full-page environment and all four content sections', () => {
    expect(home).toContain('<HomeCinematicBackground />');
    expect(home).toContain('<PodiumBrandHero />');
    expect(home).toContain('<HomeRaceControl race={nextRace} />');
    expect(home).toContain('<HomeSeasonOverview />');
    expect(home).toContain('<HomeStoryLinks />');
    const html = renderToStaticMarkup(<HomeCinematicBackground />);
    expect(html).toContain('data-home-environment="full-page"');
    expect(html).toContain('data-aerocore-mode="fallback"');
    expect(html).not.toMatch(/<canvas|<img|<video|<picture/i);
  });
  it('uses an original aerial-energy HUD, without track or vehicle', () => {
    const html = renderToStaticMarkup(<HomeRacePulseScene />);
    expect(html).toContain('data-home-hero-visual="aerocore"');
    expect(html).toContain('home-pulse__flow-labels');
    expect(html).not.toMatch(/road|track|trajectory|kerb|<canvas|<img|<video/i);
    expect(hero).toContain('<HomeRacePulseScene />');
    expect(hero).toContain('r1-cinema--v7');
    expect(hero).toContain("navigate('/showroom')");
  });
  it('isolates Three.js behind a dynamic import and respects reduced motion', () => {
    expect(background).toContain("import('./aerocore/AeroCanvas')");
    expect(background).toContain('prefers-reduced-motion: reduce');
    expect(background).not.toMatch(/from ['"](?:three|@react-three\/fiber|@react-three\/drei)['"]/);
    expect(home).not.toContain('ModelBShowroom');
  });
});
