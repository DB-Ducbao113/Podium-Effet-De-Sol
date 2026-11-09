import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CALENDAR_2026, getStandings } from '../../data/championship';
import { HomeCommandStrip } from './HomeCommandStrip';

const nav = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));

vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) => selector({ lang: nav.lang }),
}));
vi.mock('../../store/useChampionshipStore', () => ({
  useChampionshipStore: (selector: (state: {
    calculatedStandings: Record<number, unknown>;
    detailedResults: Record<number, unknown>;
  }) => unknown) => selector({ calculatedStandings: {}, detailedResults: {} }),
}));

afterEach(() => {
  nav.lang = 'en';
});

const render = (race?: (typeof CALENDAR_2026)[number]) =>
  renderToStaticMarkup(<MemoryRouter><HomeCommandStrip race={race} /></MemoryRouter>);

describe('HomeCommandStrip — live season instruments', () => {
  it('reads the verified leader and routes cells to calendar + driver standings', () => {
    const html = render(CALENDAR_2026[0]);
    expect(html).toContain('data-home-instruments');
    expect(html).toContain('href="/season/2026?tab=calendar"');
    expect(html).toContain('href="/season/2026?tab=standings&amp;category=drivers"');
    expect(html).toContain(getStandings(2026).drivers[0].driverName);
    expect(html).toContain(CALENDAR_2026[0].location);
    expect((html.match(/home-command__cell--/g) ?? []).length).toBe(3);
  });

  it('shows a calm season-complete fallback when no upcoming race exists', () => {
    const html = render();
    expect(html).toContain('Season complete');
    expect(html).toContain('View 2026 calendar');
    expect(html).not.toContain('role="timer"');
  });

  it('derives season progress from completed rounds and exposes a numeric bar', () => {
    const html = render();
    expect(html).toContain('0% rounds complete');
    expect(html).toContain('home-command__bar');
    expect(html).toContain('data-numeric="true"');
    expect(html).toContain(String(CALENDAR_2026.length));
  });

  it('switches every instrument label to Vietnamese', () => {
    nav.lang = 'vi';
    const html = render(CALENDAR_2026[0]);
    for (const label of ['CHẶNG TIẾP THEO', 'DẪN ĐẦU VĐQG', 'TIẾN ĐỘ MÙA']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('ĐIỂM');
    expect(html).toContain('Thông số mùa giải 2026');
  });
});