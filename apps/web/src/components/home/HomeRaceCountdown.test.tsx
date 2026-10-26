import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CALENDAR_2026 } from '../../data/championship';
import { HomeRaceCountdown } from './HomeRaceCountdown';

describe('HomeRaceCountdown', () => {
  it('renders the supplied round and session schedule without inventing result states', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z'));
    const race = CALENDAR_2026[0];
    const html = renderToStaticMarkup(<MemoryRouter><HomeRaceCountdown race={race} /></MemoryRouter>);
    vi.useRealTimers();
    expect(html).toContain(race.name);
    expect(html).toContain(race.circuit);
    expect(html).toContain('h1-countdown__session');
    expect(html).toContain('Tiến độ lịch cuối tuần đua');
    expect(html).toContain('h1-countdown__digits');
    expect((html.match(/h25-odometer__window/g) ?? []).length).toBeGreaterThanOrEqual(8);
    expect(html).not.toContain('LIVE RESULT');
  });

  it('offers a calendar route when no upcoming round exists', () => {
    const html = renderToStaticMarkup(<MemoryRouter><HomeRaceCountdown /></MemoryRouter>);
    expect(html).toContain('/season/2026?tab=calendar');
    expect(html).not.toContain('h1-countdown__session');
  });

  it('keeps the next-session countdown visible during a scheduled live session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T02:00:00Z'));
    const html = renderToStaticMarkup(<MemoryRouter><HomeRaceCountdown race={CALENDAR_2026[0]} /></MemoryRouter>);
    vi.useRealTimers();
    expect(html).toContain('Phiên đang diễn ra theo lịch');
    expect(html).toContain('h1-countdown__digits');
  });
});
