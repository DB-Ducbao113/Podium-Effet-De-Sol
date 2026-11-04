import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeStoryLinks } from './HomeStoryLinks';

const nav = vi.hoisted(() => ({ lang: 'en' as 'en' | 'vi' }));

vi.mock('../../store/useNavigationStore', () => ({
  useNavigationStore: (selector: (state: { lang: 'en' | 'vi' }) => unknown) => selector({ lang: nav.lang }),
}));

afterEach(() => {
  nav.lang = 'en';
  vi.unstubAllEnvs();
});

describe('Homepage engineering story link', () => {
  it('points to Inside the Machine with matching copy in local development', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeStoryLinks />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/engineering"');
    expect(html).toContain('Inside the Machine');
    expect(html).toContain('Step inside the reference car');
    expect(html).not.toContain('Floor, airflow and engineering choices');
  });

  it('falls back to car anatomy outside local development', () => {
    vi.stubEnv('DEV', false);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeStoryLinks />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/engineering/car-anatomy"');
    expect(html).toContain('Floor, airflow and engineering choices');
  });

  it('renders all six category labels alongside their titles', () => {
    nav.lang = 'en';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeStoryLinks />
      </MemoryRouter>,
    );
    for (const label of ['Results', 'Standings', 'Drivers', 'Teams', 'Showroom 3D', 'Engineering']) {
      expect(html).toContain(`<span class="h25-card__type">${label}</span>`);
    }
    expect(html.split('h25-card__body').length - 1).toBe(6);
  });

  it('translates every category label in Vietnamese', () => {
    nav.lang = 'vi';
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomeStoryLinks />
      </MemoryRouter>,
    );
    for (const label of ['Kết quả', 'Bảng xếp hạng', 'Tay đua', 'Đội đua', 'Showroom 3D', 'Kỹ thuật']) {
      expect(html).toContain(`<span class="h25-card__type">${label}</span>`);
    }
    expect(html).not.toContain('<span class="h25-card__type">Engineering</span>');
  });
});
