import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeCinematicBackground } from './HomeCinematicBackground';
import { HomeRacePulseScene } from './HomeRacePulseScene';

const root = 'src/components/home';
const home = readFileSync(`${root}/HomeView.tsx`, 'utf8');
const hero = readFileSync(`${root}/PodiumBrandHero.tsx`, 'utf8');
const scene = readFileSync(`${root}/HomeRacePulseScene.tsx`, 'utf8');

describe('Homepage V7 — background is for the WHOLE Home, not Model B', () => {
  it('mounts one unified scroll-reactive background as a HomeView sibling of every section', () => {
    expect(home).toContain('<HomeCinematicBackground />');
    expect(home).toContain('<PodiumBrandHero />');
    expect(home).toContain('<HomeRaceControl race={nextRace} />');
    expect(home).toContain('<HomeSeasonOverview />');
    expect(home).toContain('<HomeStoryLinks />');
    expect(home.indexOf('<HomeCinematicBackground />')).toBeLessThan(home.indexOf('<PodiumBrandHero />'));
    const html = renderToStaticMarkup(<HomeCinematicBackground />);
    expect(html).toContain('data-home-environment="full-page"');
    expect(html).toContain('home-cinematic__racing-line');
    expect(html).toContain('home-cinematic__sector--fight');
    expect(html).toContain('home-cinematic__sector--explore');
    expect(html).not.toMatch(/<canvas|<img|<video|<picture/i);
  });

  it('uses an original F1 speed scene instead of a second showroom car', () => {
    const html = renderToStaticMarkup(<HomeRacePulseScene />);
    expect(html).toContain('data-home-hero-visual="race-energy"');
    expect(html).toContain('home-pulse__trajectory');
    expect(html).toContain('home-pulse__lights');
    expect(hero).toContain('<HomeRacePulseScene />');
    expect(hero).toContain('r1-cinema--v7');
    for (const source of [home, hero, scene]) {
      expect(source).not.toMatch(/HomeModelBStage|HomeHudScene|HomeTrackEnvironment3D|loadModelB|model-b\.glb|eds-g01|<Canvas\b|hero-h3-2\.mp4/);
    }
    expect(html).not.toMatch(/<canvas|<img|<video|<picture/i);
  });

  it('retains the real Showroom route without importing its model into Homepage', () => {
    expect(hero).toContain("navigate('/showroom')");
    expect(home).not.toContain('ModelBShowroom');
  });
});
