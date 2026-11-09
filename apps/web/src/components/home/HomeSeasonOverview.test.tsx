import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getStandings } from '../../data/championship';
import { HomeSeasonOverview } from './HomeSeasonOverview';

describe('HomeSeasonOverview', () => {
  it('uses existing season standings and preserves both detailed destinations', () => {
    const html = renderToStaticMarkup(<MemoryRouter><HomeSeasonOverview /></MemoryRouter>);
    expect(html).toContain('id="championship-overview"');
    expect(html).toContain(getStandings(2026).drivers[0].driverName);
    expect(html).toContain(getStandings(2026).constructors[0].teamName);
    expect(html).toContain('tab=standings&amp;category=drivers');
    expect(html).toContain('tab=standings&amp;category=constructors');
    expect(html).toContain('TOP 3 / 2026');
    expect((html.match(/VIEW ALL/g) ?? [])).toHaveLength(2);
    expect(html).not.toContain('data-asset-slot="driver-photo"');
    expect(html).not.toContain('home-title-fight__team-mark');
  });

  it('exposes a rank order per row so the pinned floor can stagger the score bars', () => {
    const html = renderToStaticMarkup(<MemoryRouter><HomeSeasonOverview /></MemoryRouter>);
    expect((html.match(/--home-rank-order:0/g) ?? []).length).toBe(2);
    expect((html.match(/--home-rank-order:1/g) ?? []).length).toBe(2);
    expect((html.match(/--home-rank-order:2/g) ?? []).length).toBe(2);
  });
});
