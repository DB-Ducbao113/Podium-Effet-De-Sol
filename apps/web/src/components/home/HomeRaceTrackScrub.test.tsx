import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CALENDAR_2026 } from '../../data/championship';
import { HomeRaceTrackScrub } from './HomeRaceTrackScrub';

describe('HomeRaceTrackScrub', () => {
  it('draws the verified next-round circuit as a normalized scroll trace', () => {
    const html = renderToStaticMarkup(<HomeRaceTrackScrub race={CALENDAR_2026[0]} />);
    expect(html).toContain('class="home-rc__track"');
    expect(html).toContain('pathLength="1"');
    expect(html).toContain('stroke-dasharray="1"');
    expect(html).toContain('stroke-dashoffset="1"');
    expect(html).toContain('home-rc__track-draw');
    expect(html).toContain('<circle');
    expect(html).not.toMatch(/<img|<canvas|<video/i);
  });

  it('renders nothing without a round so the map keeps its decorative fallback', () => {
    expect(renderToStaticMarkup(<HomeRaceTrackScrub />)).toBe('');
  });
});