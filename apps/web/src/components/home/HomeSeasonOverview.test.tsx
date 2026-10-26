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
  });
});
