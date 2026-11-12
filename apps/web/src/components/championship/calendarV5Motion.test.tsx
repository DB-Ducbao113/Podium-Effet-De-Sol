import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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

  it('preserves 2026 World Tour and uses one global navigation, plus functional round details',()=>{
    const html=renderToStaticMarkup(<MemoryRouter initialEntries={['/season/2026?tab=calendar']}>
      <RaceCalendarJourney season={2026}/>
    </MemoryRouter>);
    expect(html).toContain('cal-v5__world');
    expect(html).toContain('cal-v5__ambient');
    expect(html).toContain('cal-v5__stage-caption');
    expect(html).toContain('href="/season/2026?tab=calendar&amp;view=classic"');
    expect(html).not.toContain('aria-label="Championship pages"');
    expect(html).toContain('Season round navigation');
    expect(html).toContain('rcj-progress');
    expect(html).toContain('rcj-scroll-beat');
  });
});
