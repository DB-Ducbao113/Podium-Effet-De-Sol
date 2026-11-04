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

describe('Homepage Launch Control V3', () => {
  it('does not render the removed drift video or drift poster', () => {
    const html = markup(<PodiumBrandHero />);
    expect(html).not.toContain('<video');
    expect(html).not.toContain('hero-h3-2.mp4');
    expect(html).not.toContain('hero-h3-2-poster.png');
    expect(html).not.toContain('TOKYO DRIFT');
    expect(html).toContain('RACE');
    expect(html).toContain('BEYOND');
    expect(html).toContain('LIMITS.');
    expect(html).toContain('LAUNCH CONTROL');
    expect(html).toContain('src="/images/p4/template/rc-hero-1344.webp"');
  });

  it('keeps race map and driver photographs empty during the layout phase', () => {
    const race = markup(<HomeRaceControl race={CALENDAR_2026[0]} />);
    const standings = markup(<HomeSeasonOverview />);
    expect(race).toContain('data-asset-slot="circuit-map"');
    expect(race).not.toContain('circuit-map.webp');
    expect(race).toContain('/season/2026?tab=calendar');
    expect(standings).toContain('data-asset-slot="driver-photo"');
    expect(standings).not.toContain('<img');
    expect(standings).toContain('category=drivers');
    expect(standings).toContain('category=constructors');
  });
});
