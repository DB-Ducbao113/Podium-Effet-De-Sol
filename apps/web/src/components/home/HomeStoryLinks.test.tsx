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

describe('Homepage Explore gateways', () => {
  it('links the four primary destination sections without duplicating race results or standings', () => {
    const html = render();
    expect(html).toContain('href="/showroom"');
    expect(html).toContain('href="/drivers"');
    expect(html).toContain('href="/teams"');
    expect(html).toContain('href="/engineering"');
    expect((html.match(/eds-explore__card--/g) ?? []).length).toBe(4);
    expect(html).not.toContain('href="/season/2026?tab=results"');
    expect(html).not.toContain('href="/season/2026?tab=standings"');
  });

  it('uses a car anatomy fallback when Inside the Machine is not in the production build', () => {
    vi.stubEnv('DEV', false);
    const html = render();
    expect(html).toContain('href="/engineering/car-anatomy"');
    expect(html).not.toContain('href="/engineering"');
  });

  it('renders clean Vietnamese and English card labels without extra descriptive copy', () => {
    const english = render();
    for (const title of ['Showroom 3D', 'Engineering', 'Drivers', 'Teams']) {
      expect(english).toContain(`<strong>${title}</strong>`);
    }
    nav.lang = 'vi';
    const vietnamese = render();
    for (const title of ['Showroom 3D', 'Kỹ thuật', 'Tay đua', 'Đội đua']) {
      expect(vietnamese).toContain(`<strong>${title}</strong>`);
    }
    expect(vietnamese).not.toContain('Step inside the reference car');
    expect(vietnamese).not.toContain('Floor, airflow and engineering choices');
  });

  it('uses decorative image alt text and lazy loading for all four cards', () => {
    const html = render();
    expect((html.match(/loading="lazy"/g) ?? []).length).toBe(4);
    expect((html.match(/alt=""/g) ?? []).length).toBe(4);
    expect(html).toContain('engineering-flow.svg');
    expect(html).toContain('driver-helmet.svg');
    expect(html).toContain('team-garage.svg');
  });
});
