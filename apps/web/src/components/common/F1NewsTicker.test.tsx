import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { F1NewsTicker } from './F1NewsTicker';
import { useChampionshipStore } from '../../store/useChampionshipStore';
import { getStandings } from '../../data/championship';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
}));

describe('F1NewsTicker Component', () => {
  it('renders the data-backed EDS feed without legacy illustrative headlines', () => {
    const html = renderToStaticMarkup(<F1NewsTicker />);

    expect(html).toContain('EDS FEED');

    // Contains the animate-ticker-marquee class
    expect(html).toContain('animate-ticker-marquee');
    const leader =
      useChampionshipStore.getState().calculatedStandings[2026]?.drivers[0] ??
      getStandings(2026).drivers[0];
    expect(html).toContain(leader.driverName);

    expect(html).not.toContain('SEPANG: VERSTAPPEN P1');
    expect(html).not.toContain('ANTONELLI (MERCEDES) 320');

    // Retired Live Center must not be advertised.
    expect(html).not.toContain('LIVE CENTER');
    expect(html).not.toContain('/LIVE');
  });

  it('renders interactive play/pause button', () => {
    const html = renderToStaticMarkup(<F1NewsTicker />);

    // Pause button is rendered
    expect(html).toMatch(/aria-label="(?:Pause ticker|Tạm dừng dòng tin)"/);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('data-paused="false"');
  });
});
