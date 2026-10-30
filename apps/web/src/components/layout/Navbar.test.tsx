import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';
import { useNavigationStore } from '../../store/useNavigationStore';

const initialLang = useNavigationStore.getState().lang;

afterEach(() => {
  useNavigationStore.setState({ lang: initialLang });
  vi.unstubAllEnvs();
});

describe('Navbar after Live Center removal', () => {
  it.each(['vi', 'en'] as const)(
    'keeps the main navigation without live/archive links (%s)',
    (lang) => {
      useNavigationStore.setState({ lang });
      const html = renderToStaticMarkup(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>,
      );
      expect(html).toContain('href="/season/2026"');
      expect(html).toContain('href="/showroom"');
      expect(html).toContain('href="/engineering/car-anatomy"');
      expect(html).not.toContain('href="/teams"');
      expect(html).not.toContain('href="/drivers"');
      for (const path of ['/live', '/timing', '/archive']) {
        expect(html).not.toContain(`href="${path}"`);
      }
    },
  );
});

describe('H1 navigation subtabs', () => {
  it('keeps championship and engineering deep links while showroom controls keep its route', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(html).toContain('/season/2026?tab=standings&amp;category=drivers');
    expect(html).not.toContain('/#championship-overview');
    expect(html).not.toContain('tab=overview');
    expect(html).toContain('/season/2026?tab=results');
    expect(html).toContain('/engineering/insights');
    expect(html).not.toContain('/engineering/car-anatomy?chapter=diffuser');
    expect((html.match(/href="\/showroom"/g) ?? []).length).toBeGreaterThan(1);
    expect(html).toContain('href="/about"');
    expect(html).toContain('/season/2026?tab=teams');
    expect(html).toContain('/season/2026?tab=drivers');
  });
});

describe('Inside the Machine Engineering integration', () => {
  it('is the default Engineering target in local development', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(html).toContain('href="/engineering"');
    expect(html).toContain('Inside the Machine');
    expect(html).toContain('href="/engineering/insights"');
    expect(html).toContain('href="/engineering/car-anatomy"');
    expect(html).not.toContain('/engineering/car-anatomy?chapter=diffuser');
  });
});
