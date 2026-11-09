import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CALENDAR_2026 } from '../../data/championship';
import { HomeSessionTimeline } from './HomeSessionTimeline';

const nav = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));

vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) => selector({ lang: nav.lang }),
}));
vi.mock('../../store/useTimezoneStore', () => ({
  useTimezoneStore: (selector: (state: { preference: string }) => unknown) => selector({ preference: 'UTC' }),
}));

afterEach(() => { nav.lang = 'en'; });

const render = (race?: (typeof CALENDAR_2026)[number], now = Date.UTC(2025, 0, 1)) =>
  renderToStaticMarkup(<HomeSessionTimeline race={race} now={now} />);

describe('HomeSessionTimeline', () => {
  it('lists the real weekend sessions in order for a standard round', () => {
    const html = render(CALENDAR_2026[0]);
    expect((html.match(/data-session-row/g) ?? []).length).toBe(5);
    for (const label of ['Practice 1', 'Practice 2', 'Practice 3', 'Qualifying', 'Race']) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain('Sprint');
    expect(html).toContain('WEEKEND SESSIONS');
    expect(html).toContain('data-scrub-active="false"');
  });

  it('swaps practice sessions for sprint sessions on a sprint round', () => {
    const html = render(CALENDAR_2026[1]);
    expect((html.match(/data-session-row/g) ?? []).length).toBe(5);
    expect(html).toContain('Sprint Qual.');
    expect(html).toContain('>Sprint<');
    expect(html).not.toContain('Practice 2');
  });

  it('derives done/live/upcoming state from the wall clock', () => {
    expect((render(CALENDAR_2026[0], Date.UTC(2027, 0, 1)).match(/data-state="done"/g) ?? []).length).toBe(5);
    expect((render(CALENDAR_2026[0], Date.UTC(2025, 0, 1)).match(/data-state="upcoming"/g) ?? []).length).toBe(5);
  });

  it('renders nothing without a round and localizes labels in Vietnamese', () => {
    expect(render()).toBe('');
    nav.lang = 'vi';
    const html = render(CALENDAR_2026[0]);
    expect(html).toContain('Thử nghiệm 1');
    expect(html).toContain('Đua chính');
    expect(html).toContain('LỊCH CUỐI TUẦN');
  });
});