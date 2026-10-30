import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeStoryLinks } from './HomeStoryLinks';
import { useNavigationStore } from '../../store/useNavigationStore';

const initialLang = useNavigationStore.getState().lang;

afterEach(() => {
  useNavigationStore.setState({ lang: initialLang });
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
});
