import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { UNKNOWN_TEAM_ID } from '../../types';
import type { ClassificationRow } from '../../results-engine/availability';
import { RaceResults } from './RaceResults';
import { ResultsV5Podium } from './ResultsV5Podium';

const row=(position:number):ClassificationRow=>({
  position,driverId:'unknown',driverName:'Fixture Driver',
  driverCode:'TST',teamId:UNKNOWN_TEAM_ID,teamName:'Fixture Team',
} as ClassificationRow);

describe('Results V5 — source-preserving editorial design',()=>{
  it('keeps round/session selection, source-aware states and the complete classification table',()=>{
    const html=renderToStaticMarkup(
      <MemoryRouter initialEntries={['/season/2026?tab=results&round=1&session=race']}>
        <RaceResults season={2026}/>
      </MemoryRouter>
    );
    expect(html).toContain('results-v5');
    expect(html).toContain('RACE ARCHIVE');
    expect(html).toContain('rounds with results');
    expect(html).toContain('class="rc-round-rail"');
    expect(html).toContain('class="rc-round-hero"');
    expect(html).toContain('id="c11-tab-race"');
    expect(html).toContain('id="c11-classification"');
    expect(html).toContain('c11-table');
    expect(html).toContain('rc-round-media');
  });

  it('shows top 3 only for complete ranks and never fabricates people or points',()=>{
    const html=renderToStaticMarkup(<MemoryRouter>
      <ResultsV5Podium rows={[row(3),row(1),row(2)]} season={2026} lang="en" sprint={false}/>
    </MemoryRouter>);
    expect(html).toContain('The front three.');
    expect(html).toContain('Fixture Driver');
    expect((html.match(/class="results-v5__podium-entry"/g)||[])).toHaveLength(3);
    const absent=renderToStaticMarkup(<MemoryRouter>
      <ResultsV5Podium rows={[row(1),row(2)]} season={2026} lang="en" sprint={false}/>
    </MemoryRouter>);
    expect(absent).toBe('');
  });

  it('keeps source selection and attribution, and provides a static accessible fallback',()=>{
    const component=readFileSync('src/components/championship/WeekendResults.tsx','utf8');
    const css=readFileSync('src/components/championship/resultsV5.css','utf8');
    expect(component).toContain('getSessionClassification');
    expect(component).toContain('getAvailableSessions');
    expect(component).toContain('classificationPresentation === "final"');
    expect(component).toContain('venueHero.sourcePage');
    expect(component).toContain('aria-selected={selectedSession === key}');
    expect(component).toContain('onKeyDown={(event)');
    expect(css).toContain('@supports (animation-timeline:view())');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('transform:none!important');
    expect(css).not.toMatch(/scale\(1\.[2-9]/);
  });
});
