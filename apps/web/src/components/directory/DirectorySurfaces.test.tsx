import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DRIVER_STANDINGS_2024, DRIVER_STANDINGS_2026, CONSTRUCTOR_STANDINGS_2026 } from '../../data/championship/standings';
import manifest from '../../data/visualAssets/extended2026Manifest.json';
import { driverAssets, teamPrefixes } from '../../utils/f1VisualAssets2026';
import { DriverCard, TeamCard } from './DirectorySurfaces';
import { DriverPortrait } from './DriverPortrait';
import { ExtraArtwork } from './ExtraArtwork';

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
      const html = render(<DriverCard row={row} season={season} lang="vi" />);
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
      <TeamCard row={row} season={2026} lang="en" drivers={DRIVER_STANDINGS_2026} />,
    );
    expect(html).toContain('p5-team-card--garage');
    expect(html).toContain('p5-team-card-art');
    expect(html).toContain('p5-team-card-lineup');
    expect(html).toContain('p5-team-card-points');
    expect(html).toContain('href="/teams/' + row.teamId + '?season=2026"');
  });



  it('uses the prototype team palette for both light garage and dark driver cards without altering standings',()=>{
    const driver=DRIVER_STANDINGS_2026.find(row=>row.driverId==='norris')!;
    const team=CONSTRUCTOR_STANDINGS_2026.find(row=>row.teamId==='mclaren')!;
    const driverHtml=render(<DriverCard row={driver} season={2026} lang="en"/>);
    const teamHtml=render(<TeamCard row={team} season={2026} lang="en" drivers={DRIVER_STANDINGS_2026}/>);
    expect(driverHtml).toContain('--peds-dir-team:#e89c5b');
    expect(driverHtml).toContain('--peds-dir-driver:#b15b31');
    expect(teamHtml).toContain('--peds-dir-team:#e89c5b');
    expect(teamHtml).toContain('--peds-dir-accent:#47c7fc');
    expect(teamHtml).toContain('--peds-dir-deep:#583216');
    expect(teamHtml).toContain('--peds-dir-paper:#f4e2d2');
    expect(driverHtml).toContain('data-team-identity="mclaren"');
    expect(teamHtml).toContain('data-team-identity="mclaren"');
    expect(teamHtml).toContain(String(team.points));
    expect(driverHtml).toContain(String(driver.points));
  });

  it('keeps the source 2024 team association when a driver changes teams between seasons',()=>{
    const moved=DRIVER_STANDINGS_2024.find(row=>row.driverId==='hamilton')!;
    const html=render(<DriverCard row={moved} season={2024} lang="en"/>);
    expect(html).toContain('--peds-dir-team:');
    expect(html).not.toContain('--peds-dir-driver:#953b34');
    expect(html).toContain('data-team-identity="mercedes"');
    expect(html).toContain('--peds-dir-accent:#c8ccce');
  });

  it('renders the owner image source without requiring the WebP to exist in GitHub', () => {
    const html = render(<DriverPortrait driverId="leclerc" season={2026} alt="Charles Leclerc" number={16} />);
    expect(html).toContain('data-p5-image-source="owner-concept"');
    expect(html).toContain('fer-charles-portrait.webp');
    expect(html).toContain('alt="Charles Leclerc"');
  });

  it('renders fallback when no optional review poster is configured', () => {
    const html = render(
      <ExtraArtwork fallback={<span data-fallback="portrait">Fallback</span>} />,
    );
    expect(html).toContain('data-fallback="portrait"');
    expect(html).not.toContain('<img');
  });
});
