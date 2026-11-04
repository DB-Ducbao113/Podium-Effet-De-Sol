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
    for (const target of ['/showroom', '/engineering', '/drivers', '/teams']) {
      expect(html).toContain(`href="${target}"`);
    }
    expect((html.match(/eds-explore__card--/g) ?? []).length).toBe(4);
    expect(html).not.toContain('href="/season/2026?tab=results"');
    expect(html).not.toContain('href="/season/2026?tab=standings"');
  });

  it('uses only local DEV review assets when available', () => {
    const html = render();
    for (const id of ['showroom', 'engineering', 'drivers', 'teams']) {
      expect(html).toContain(`src="/__peds-home-explore/${id}.webp"`);
    }
  });

  it('retains safe public fallback assets and car-anatomy route in production', () => {
    vi.stubEnv('DEV', false);
    const html = render();
    expect(html).toContain('href="/engineering/car-anatomy"');
    expect(html).not.toContain('src="/__peds-home-explore/');
    expect(html).toContain('rc-hero-1344.webp');
    expect(html).toContain('engineering-flow.svg');
    expect(html).toContain('driver-helmet.svg');
    expect(html).toContain('team-garage.svg');
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
  });
});
