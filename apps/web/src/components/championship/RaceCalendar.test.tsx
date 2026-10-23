import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RaceCalendar } from './RaceCalendar';

describe('RaceCalendar Component Multi-Season Rendering', () => {
  it('renders 2024 season calendar correctly with 24 rounds, Bahrain as round 1, and completion status', () => {
    const html = renderToStaticMarkup(<RaceCalendar season={2024} />);
    expect(html).toContain('2024');
    expect(html).toContain('Bahrain Grand Prix');
    expect(html).toContain('Sakhir');
    expect(html).toContain('24 / 24');
    expect(html).toMatch(/Mùa giải hoàn tất|Season complete/);
  });

  it('renders 2025 season calendar correctly with 24 rounds, Australia as round 1', () => {
    const html = renderToStaticMarkup(<RaceCalendar season={2025} />);
    expect(html).toContain('2025');
    expect(html).toContain('Australian Grand Prix');
    expect(html).toContain('Melbourne');
    expect(html).toContain('24 / 24');
    expect(html).toMatch(/Mùa giải hoàn tất|Season complete/);
  });

  it('renders 2026 season calendar correctly with next race indicator', () => {
    const html = renderToStaticMarkup(<RaceCalendar season={2026} />);
    expect(html).toContain('2026');
    expect(html).toContain('Australian Grand Prix');
    expect(html).toContain('23');
  });
});
