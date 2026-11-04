import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from './Navbar';
import { buildNavItems } from './navItems';

const renderAt = (path = '/') =>
  renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Navbar /></MemoryRouter>);

const currentPages = (html: string) => (html.match(/aria-current="page"/g) ?? []).length;

describe('V5 grouped global navigation', () => {
  it('renders one flat primary navigation with existing routes only', () => {
    const html = renderAt();
    for (const href of ['/', '/season/2026?tab=results', '/season/2026?tab=standings', '/drivers', '/teams', '/showroom', '/engineering']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('h1-nav__cta');
    for (const path of ['/live', '/timing', '/archive', '/races', '/circuits', '/stories']) {
      expect(html).not.toContain(`href="${path}"`);
    }
    expect(html).not.toContain('/season/2026?tab=teams');
    expect(html).not.toContain('/season/2026?tab=drivers');
  });

  it('uses spacious grouped desktop destinations with all original routes accessible', () => {
    const html = renderAt('/');
    expect(html).toContain('Championship');
    expect(html).toContain('The Grid');
    expect(html).toContain('h1-nav-dropdown-championship');
    expect(html).toContain('h1-nav-dropdown-grid');
    expect(html).toContain('href="/teams"');
    expect(html).toContain('href="/season/2026?tab=calendar"');
  });

  it('renders the official PODIUM EDS logo with an accessible home label', () => {
    const html = renderAt();
    expect(html).toContain('h1-nav__brand');
    expect(html).toContain('h1-nav__brand-logo');
    expect(html).toContain('src="/logo/logo.png"');
    expect(html).toContain('alt="PODIUM — Effet de Sol"');
    expect(html).not.toContain('h1-nav__wordmark');
    expect(html).toContain('aria-label="PODIUM EDS — Home"');
  });

  it('keeps every top-level and child id/label unique in both languages', () => {
    for (const lang of ['vi', 'en'] as const) {
      for (const dev of [true, false]) {
        const items = buildNavItems(lang, dev);
        expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
        expect(new Set(items.map((item) => item.label)).size).toBe(items.length);
        for (const item of items) {
          if (!item.children) continue;
          expect(new Set(item.children.map((child) => child.id)).size).toBe(item.children.length);
          expect(new Set(item.children.map((child) => child.label)).size).toBe(item.children.length);
        }
      }
    }
  });

  it('preserves results, standings and calendar deep links', () => {
    const html = renderAt();
    expect(html).toContain('/season/2026?tab=standings&amp;category=drivers');
    expect(html).toContain('/season/2026?tab=standings&amp;category=constructors');
    expect(html).toContain('/season/2026?tab=calendar');
    expect(html).not.toContain('/#championship-overview');
    expect(html).not.toContain('tab=overview');
  });

  it('keeps the current season in the primary navigation', () => {
    const html = renderAt('/season/2025?tab=standings&category=constructors');
    expect(html).toContain('/season/2025?tab=standings&amp;category=drivers');
    expect(html).toContain('/season/2025?tab=standings&amp;category=constructors');
    expect(html).toContain('/season/2025?tab=calendar');
  });
});

describe('P2 active navigation state', () => {
  it.each([
    ['/', '/'],
    ['/season/2026?tab=results', '/season/2026?tab=results'],
    ['/season/2026?tab=standings', '/season/2026?tab=standings'],
    ['/drivers', '/drivers'],
    ['/teams', '/teams'],
    ['/showroom', '/showroom'],
  ])('marks exactly one current page for %s', (path, href) => {
    const html = renderAt(path);
    expect(currentPages(html)).toBe(1);
    const anchors = html.match(/<a[^>]*>/g) ?? [];
    const anchor = anchors.find((tag) => tag.includes(`href="${href}"`) && /h1-nav__(link|cta)/.test(tag)) ?? '';
    expect(anchor).toContain('aria-current="page"');
  });

  it('marks calendar and race routes as results', () => {
    for (const path of ['/season/2026?tab=calendar', '/season/2026/race/3']) {
      const html = renderAt(path);
      const anchors = html.match(/<a[^>]*>/g) ?? [];
      const anchor = anchors.find((tag) => tag.includes('href="/season/2026?tab=results"') && tag.includes('h1-nav__link')) ?? '';
      expect(anchor).toContain('aria-current="page"');
    }
  });
});

describe('Inside the Machine Engineering integration', () => {
  it('is the default Engineering target in local development', () => {
    const html = renderAt();
    expect(html).toContain('href="/engineering"');
    expect(html).toContain('Inside the Machine');
    expect(html).toContain('href="/engineering/insights"');
    expect(html).toContain('href="/engineering/car-anatomy"');
    expect(html).not.toContain('/engineering/car-anatomy?chapter=diffuser');
  });
});
