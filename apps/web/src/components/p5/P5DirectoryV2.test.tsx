import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DRIVER_STANDINGS_2024, DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../../data/championship/standings';
import manifest from '../../data/visualAssets/p5Extended2026Manifest.json';
import { driverAssets, teamPrefixes } from '../../utils/f1VisualAssets2026';
import { P5DriverCard, P5TeamCard } from './P5DirectorySurfaces';
import { P5Portrait } from './P5Portrait';
import { P5ExtraArtwork } from './P5ExtraArtwork';

const render = (ui: ReactNode) => renderToStaticMarkup(<MemoryRouter>{ui}</MemoryRouter>);

describe('P5-R1 owner-local visual contracts', () => {
  it('maps exactly 22 concept drivers, 22 portrait files and 11 team posters for 2026', () => {
    const files = manifest.files;
    expect(Object.keys(driverAssets)).toHaveLength(22);
    expect(Object.keys(teamPrefixes)).toHaveLength(11);
    const driverSlugs = Object.values(driverAssets);
    const teamSlugs = Object.values(teamPrefixes);
    for (const slug of driverSlugs) {
      expect(files.some((file) => file.group === 'drivers' && file.name === slug + '.webp')).toBe(true);
      expect(files.some((file) => file.group === 'headshots' && file.name === slug + '-portrait.webp')).toBe(true);
    }
    for (const slug of teamSlugs) {
      expect(files.some((file) => file.group === 'teams' && file.name === slug + '-team.webp')).toBe(true);
    }
    expect(new Set(driverSlugs).size).toBe(22);
    expect(new Set(teamSlugs).size).toBe(11);
  });

  it('uses the same driver card structure for 2024 and 2026, with no poster-specific layout', () => {
    const current = DRIVER_STANDINGS_2026[0];
    const old = DRIVER_STANDINGS_2024[0];
    for (const [row, season] of [[current, 2026], [old, 2024]] as const) {
      const html = render(<P5DriverCard row={row} season={season} lang="vi" />);
      expect(html).toContain('p5-driver-card--directory');
      expect(html).toContain('p5-driver-card-visual');
      expect(html).toContain('p5-driver-card-body');
      expect(html).toContain('p5-driver-card-points');
      expect(html).toContain('P' + row.rank);
      expect(html).toContain('href="/drivers/' + row.driverId + '?season=' + season + '"');
      expect(html).not.toContain('p5-driver-card--poster');
    }
  });

  it('separates Team Garage artwork from lineup and championship data', () => {
    const row = CONSTRUCTOR_STANDINGS_2026[0];
    const html = render(
      <P5TeamCard row={row} season={2026} lang="en" drivers={DRIVER_STANDINGS_2026} />,
    );
    expect(html).toContain('p5-team-card--garage');
    expect(html).toContain('p5-team-card-art');
    expect(html).toContain('p5-team-card-lineup');
    expect(html).toContain('p5-team-card-points');
    expect(html).toContain('href="/teams/' + row.teamId + '?season=2026"');
  });

  it('renders the owner image source without requiring the WebP to exist in GitHub', () => {
    const html = render(<P5Portrait driverId="leclerc" season={2026} alt="Charles Leclerc" number={16} />);
    expect(html).toContain('data-p5-image-source="owner-concept"');
    expect(html).toContain('fer-charles-portrait.webp');
    expect(html).toContain('alt="Charles Leclerc"');
  });

  it('renders fallback when no optional review poster is configured', () => {
    const html = render(
      <P5ExtraArtwork fallback={<span data-fallback="portrait">Fallback</span>} />,
    );
    expect(html).toContain('data-fallback="portrait"');
    expect(html).not.toContain('<img');
  });
});
