import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeStoryLinks } from './HomeStoryLinks';

const nav = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));

vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) => selector({ lang: nav.lang }),
}));
vi.mock('../../hooks/useReveal', () => ({
  useReveal: () => ({ ref: () => undefined, isRevealed: true }),
}));

afterEach(() => {
  nav.lang = 'en';
  vi.unstubAllEnvs();
});

const render = () => renderToStaticMarkup(
  <MemoryRouter><HomeStoryLinks /></MemoryRouter>,
);

describe('Homepage Explore cinematic gateways', () => {
  it('links the four main destinations and keeps deep results/standings in their own section', () => {
    const html = render();
    for (const target of ['/showroom', '/engineering/car-anatomy', '/drivers', '/teams']) {
      expect(html).toContain(`href="${target}"`);
    }
    expect((html.match(/eds-explore__card--/g) ?? []).length).toBe(4);
    expect(html).not.toContain('href="/season/2026?tab=results"');
    expect(html).not.toContain('href="/season/2026?tab=standings"');
  });

  it('uses the restored Explore artwork cleanly below-card labels without text overlapping images', () => {
    const devHtml = render();
    expect(devHtml).not.toContain('/__peds-home-explore/');
    vi.stubEnv('DEV', false);
    const prodHtml = render();
    expect(prodHtml).toContain('href="/engineering/car-anatomy"');
    expect(prodHtml).not.toContain('src="/__peds-home-explore/');
    expect(prodHtml).toContain('/images/championship/template/rc-hero-1344.webp');
    expect(prodHtml).toContain('/images/home/explore/engineering.webp');
    expect(prodHtml).toContain('/images/home/explore/drivers.webp');
    expect(prodHtml).toContain('/images/home/explore/teams.webp');
    // Text footer bar renders outside the artwork media wrapper
    expect(prodHtml).toContain('</span><span class="eds-explore__bottom">');
  });

  it('keeps bilingual card labels short and all four decorative images accessible', () => {
    const english = render();
    for (const label of ['Showroom 3D', 'Engineering', 'Drivers', 'Teams']) {
      expect(english).toContain(`<strong>${label}</strong>`);
    }
    nav.lang = 'vi';
    const vietnamese = render();
    for (const label of ['Showroom 3D', 'Kỹ thuật', 'Tay đua', 'Đội đua']) {
      expect(vietnamese).toContain(`<strong>${label}</strong>`);
    }
    expect((vietnamese.match(/loading="lazy"/g) ?? []).length).toBe(4);
    expect((vietnamese.match(/alt=""/g) ?? []).length).toBe(4);
    expect(vietnamese).toContain('VUỐT ĐỂ KHÁM PHÁ');
    expect((vietnamese.match(/aria-pressed="true"/g) ?? []).length).toBe(1);
    expect((vietnamese.match(/aria-label="Hiện thẻ /g) ?? []).length).toBe(4);
  });
});
