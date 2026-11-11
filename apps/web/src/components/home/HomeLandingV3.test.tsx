import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CALENDAR_2026 } from '../../data/championship';
import { PodiumBrandHero } from './PodiumBrandHero';
import { HomeRaceControl } from './HomeRaceControl';
import { HomeSeasonOverview } from './HomeSeasonOverview';

function markup(node: ReactNode) {
  return renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);
}

describe('Homepage Cinematic V7', () => {
  it('does not render the removed drift video or drift poster', () => {
    const html = markup(<PodiumBrandHero />);
    expect(html).not.toContain('<video');
    expect(html).not.toContain('hero-h3-2.mp4');
    expect(html).not.toContain('hero-h3-2-poster.png');
    expect(html).not.toContain('TOKYO DRIFT');
    expect(html).toContain('Race');
    expect(html).toContain('beyond');
    expect(html).toContain('Limits.');
    expect(html).toContain('LAUNCH CONTROL');
    expect(html).toContain('data-home-instruments');
    expect(html).toContain('peds-aero01-car.webp');
    expect(html).toContain('data-f1-visual="cinematic-2.5d"');
    expect(html).toContain('f1hero__vehicle');
    expect(html).toContain('f1hero__aero');
    expect(html).toContain('data-f1-effects="ignition-v83"');
    expect(html).toContain('data-home-hero-visual="f1-2.5d"');
    expect(html).not.toContain('MODEL B / DIGITAL TWIN');
    expect(html).not.toContain('ACTIVATE 3D');
    expect(html).not.toContain('<canvas');
  });

  it('keeps the race graphic decorative and standings free of unlicensed portraits', () => {
    const race = markup(<HomeRaceControl race={CALENDAR_2026[0]} />);
    const standings = markup(<HomeSeasonOverview />);
    expect(race).toContain('data-asset-slot="circuit-map"');
    expect(race).not.toContain('circuit-map.webp');
    expect(race).toContain('/season/2026?tab=calendar');
    expect(standings).not.toContain('data-asset-slot="driver-photo"');
    expect(standings).not.toContain('<img');
    expect(standings).toContain('category=drivers');
    expect(standings).toContain('category=constructors');
  });
});
