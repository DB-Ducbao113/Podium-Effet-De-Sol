import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { getCalendarBySeason } from '../../data/championship';
import { DestinationGridV6 } from './DestinationGridV6';
import type { DestinationItem } from './DestinationGridV6';

function render(mode:'results'|'calendar',season:2024|2025|2026){
  const races:DestinationItem[]=getCalendarBySeason(season).map(race=>({
    ...race,destinationState:race.status==='completed'?'completed':'upcoming',
  }));
  return renderToStaticMarkup(<MemoryRouter>
    <DestinationGridV6 season={season} lang="en" mode={mode} items={races}/>
  </MemoryRouter>);
}

describe('Destinations V6 — grid-first race discovery',()=>{
  it('renders every real round in the right season, not a curated mock order',()=>{
    for(const season of [2024,2025,2026] as const){
      const html=render('results',season);
      const count=getCalendarBySeason(season).length;
      expect((html.match(/class="destination-v6__item"/g)||[])).toHaveLength(count);
      expect(html).toContain('DESTINATION / 01');
      expect(html).toContain('href="/season/'+season+'?tab=results&amp;round=1&amp;session=race"');
    }
    const current=render('results',2026);
    expect(current).toContain('Australia');
    expect(current).toContain('<em>Melbourne</em>');
    expect(current).toContain('class="destination-v6__card"');
    const qualifyingOnly:DestinationItem={...getCalendarBySeason(2026)[0],resultSession:'qualifying'};
    const q=renderToStaticMarkup(<MemoryRouter>
      <DestinationGridV6 season={2026} lang="en" mode="results" items={[qualifyingOnly]}/>
    </MemoryRouter>);
    expect(q).toContain('session=qualifying');
    expect(current).not.toContain('data-experience="world-tour-v6"');
    expect(current).not.toContain('c11-table');
  });

  it('makes World Tour an optional view without losing the season/round link',()=>{
    const html=render('calendar',2026);
    expect(html).toContain('data-destination-mode="calendar"');
    expect(html).toContain('World tour');
    expect(html).toContain('href="/season/2026?tab=calendar&amp;view=world"');
    expect(html).toContain('href="/season/2026?tab=calendar&amp;round=1&amp;view=classic"');
    expect(html).toContain('Season race destinations');
    expect(html).not.toContain('MiniRace');
  });

  it('matches the supplied warm stone reference with reversible accessible motion',()=>{
    const css=readFileSync('src/components/championship/destinationGridV6.css','utf8');
    const main=readFileSync('src/main.tsx','utf8');
    const parity=readFileSync('src/styles/prototypeColorParityV7.css','utf8');
    expect(main).toContain('prototypeColorParityV7.css');
    expect(parity).toContain('--peds-v6-paper:var(--peds-proto-paper)');
    expect(parity).toContain('--peds-v6-stone:var(--peds-proto-paper-deep)');
    expect(main).toContain('destinationGridV6.css');
    for(const token of ['#f0eee8','#deddd7','#171c1b','grid-template-columns:repeat(3',
      'animation-timeline:view(block)','animation-range:cover 0% cover 100%',
      'destination-v6__item:focus-within','prefers-reduced-motion:reduce'])
      expect(css).toContain(token);
    expect(css).not.toContain('scale(1.2');
  });
});
