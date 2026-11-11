import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getStandings } from '../../data/championship/standings';
import { DriversHero, GalleryHero } from './DirectorySurfaces';

const render = (ui: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(ui);

describe('2024/2025 directory header banner', () => {
  it('shows the whole 2025 driver grid behind the drivers hero', () => {
    const drivers = getStandings(2025).drivers;
    const html = render(
      <DriversHero
        season={2025}
        driverCount={drivers.length}
        teamCount={getStandings(2025).constructors.length}
        drivers={drivers}
        lang="en"
      />,
    );
    expect(html).toContain('p5-season-grid-banner');
    expect(html).toContain('p5-drivers-hero-banner');
    for (const driver of drivers) {
      expect(html).toContain(`/images/driver-portraits-ai/2025-${driver.driverId}.webp`);
    }
    expect(html).toContain('AI-generated portraits');
  });

  it('shows the 2024 driver grid behind the garage hero', () => {
    const drivers = getStandings(2024).drivers;
    const html = render(
      <GalleryHero
        kind="teams"
        season={2024}
        driverCount={drivers.length}
        teamCount={getStandings(2024).constructors.length}
        drivers={drivers}
        lang="vi"
      />,
    );
    expect(html).toContain('p5-season-grid-banner');
    expect(html).toContain('p5-gallery-hero-banner');
    for (const driver of drivers) {
      expect(html).toContain(`/images/driver-portraits-ai/2024-${driver.driverId}.webp`);
    }
    expect(html).toContain('Chân dung AI tạo dựng');
  });

  it('keeps the 2026 hero on its own artwork instead of the historical grid', () => {
    const drivers = getStandings(2026).drivers;
    const html = render(
      <DriversHero
        season={2026}
        driverCount={drivers.length}
        teamCount={getStandings(2026).constructors.length}
        drivers={drivers}
        lang="en"
      />,
    );
    expect(html).not.toContain('p5-season-grid-banner');
    expect(html).toContain('/images/concepts-2026/heroes/hero-drivers-2026.webp');
    expect(html).not.toContain('lando-helmet-2024.jpg');
  });

  it('marks the banner as decorative AI artwork for assistive technology', () => {
    const drivers = getStandings(2025).drivers;
    const html = render(
      <DriversHero
        season={2025}
        driverCount={drivers.length}
        teamCount={getStandings(2025).constructors.length}
        drivers={drivers}
        lang="en"
      />,
    );
    expect(html).toContain('data-p5-image-source="ai-generated-portrait"');
    expect(html).toContain('aria-hidden="true"');
  });
});
