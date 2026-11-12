import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RaceCalendarJourney } from './RaceCalendarJourney';
import { sampleCalendarV5Backdrop } from './calendarV5Motion';

describe('Calendar V5 World Tour — cinematic scroll contract',()=>{
  it('derives stable atmospheric frames exclusively from absolute scroll position',()=>{
    const start=sampleCalendarV5Backdrop(0,23);
    const mid=sampleCalendarV5Backdrop(11.5,23);
    const end=sampleCalendarV5Backdrop(23,23);
    for(const frame of [start,mid,end]){
      expect(frame.warm).toBeGreaterThanOrEqual(0);
      expect(frame.warm).toBeLessThanOrEqual(1);
      expect(frame.blue).toBeGreaterThanOrEqual(0);
      expect(frame.blue).toBeLessThanOrEqual(1);
      expect(frame.violet).toBeGreaterThanOrEqual(0);
      expect(frame.violet).toBeLessThanOrEqual(1);
    }
    expect(start).not.toEqual(mid);
    expect(mid).not.toEqual(end);
    expect(sampleCalendarV5Backdrop(11.5,23)).toEqual(mid);
    expect(sampleCalendarV5Backdrop(0,23)).toEqual(start);
    expect(sampleCalendarV5Backdrop(-100,23)).toEqual(start);
    expect(sampleCalendarV5Backdrop(100,23)).toEqual(end);
  });

  it('keeps the classic Calendar available and scroll in both directions without one-shot animation',()=>{
    const component=readFileSync('src/components/championship/ChampionshipCalendar.tsx','utf8');
    const css=readFileSync('src/components/championship/calendarCinematicV5.css','utf8');
    expect(component).toContain('className="c1-calendar cal-v5__detail"');
    expect(component).toContain('calendar-round-');
    expect(component).toContain('getCalendarRaceState');
    expect(component).not.toContain('createScope');
    expect(css).toContain('animation-range:cover 0% cover 100%');
    expect(css).toContain('100% {opacity:.55;transform:translate3d(32px,-24px,0);}');
    expect(css).toContain('prefers-reduced-motion:reduce');
    expect(css).toContain('.rcj-circuit-overlay');
    expect(css).not.toContain('scale(1.2');
  });

  it('preserves 2026 World Tour and uses one global navigation, plus functional round details',()=>{
    const html=renderToStaticMarkup(<MemoryRouter initialEntries={['/season/2026?tab=calendar&view=world']}>
      <RaceCalendarJourney season={2026}/>
    </MemoryRouter>);
    expect(html).toContain('cal-v5__world');
    expect(html).toContain('cal-v5__ambient');
    expect(html).toContain('cal-v5__stage-caption');
    expect(html).toContain('href="/season/2026?tab=calendar"');
    expect(html).not.toContain('aria-label="Championship pages"');
    expect(html).toContain('Season round navigation');
    expect(html).toContain('rcj-progress');
    expect(html).toContain('rcj-scroll-beat');
  });
});
