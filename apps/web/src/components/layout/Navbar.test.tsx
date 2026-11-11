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
  it('keeps desktop menu and submenu labels consistent across routes', () => {
    const labels = (path: string) => {
      const desktop = renderAt(path).match(/<nav class="h1-nav__desktop"[\s\S]*?<\/nav>/)?.[0] ?? '';
      return {
        primary: [...desktop.matchAll(/class="h1-nav__link"[^>]*><span>([^<]+)<\/span>/g)].map((match) => match[1]),
        submenus: [...desktop.matchAll(/class="h1-nav__sub"[^>]*>([^<]+)<\/a>/g)].map((match) => match[1]),
      };
    };
    expect(labels('/season/2026?tab=standings')).toEqual(labels('/'));
    expect(labels('/showroom')).toEqual(labels('/'));
  });

  it('uses the inner-route navbar treatment outside Home', () => {
    expect(renderAt('/')).not.toContain('h1-nav--inner');
    expect(renderAt('/season/2026?tab=standings')).toContain('h1-nav--inner');
    expect(renderAt('/showroom')).toContain('h1-nav--inner');
  });

  it('renders one flat primary navigation with existing routes only', () => {
    const html = renderAt();
    for (const href of ['/', '/season/2026?tab=results', '/drivers', '/teams', '/showroom', '/engineering']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('href="/season/2026?tab=standings&amp;category=drivers"');
    expect(html).toContain('h1-nav__desktop');
    for (const path of ['/live', '/timing', '/archive', '/races', '/circuits', '/stories']) {
      expect(html).not.toContain(`href="${path}"`);
    }
    expect(html).not.toContain('/season/2026?tab=teams');
    expect(html).not.toContain('/season/2026?tab=drivers');
  });

  it('shows the same desktop destinations on Home and other routes', () => {
    const html = renderAt('/');
    expect(html).toContain('Results');
    expect(html).toContain('Standings');
    expect(html).toContain('Showroom');
    expect(html).toContain('h1-nav-dropdown-results');
    expect(html).toContain('h1-nav-dropdown-standings');
    expect(html).toContain('href="/teams"');
    expect(html).toContain('href="/season/2026?tab=calendar"');
    const desktop = html.match(/<nav class="h1-nav__desktop"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect((desktop.match(/h1-nav__group/g) ?? []).length).toBeGreaterThanOrEqual(7);
    expect(desktop).not.toContain('The Grid');
    const season = renderAt('/season/2026?tab=results');
    expect(season).not.toContain('The Grid');
    expect(season).toContain('href="/showroom"');
  });

  it('keeps Results and Standings as two separate desktop destinations, like the mobile menu', () => {
    const html = renderAt('/');
    const desktop = html.match(/<nav class="h1-nav__desktop"[\s\S]*?<\/nav>/)?.[0] ?? '';
    const primary = [...desktop.matchAll(/class="h1-nav__link"[^>]*><span>([^<]+)<\/span>/g)].map((match) => match[1]);
    expect(primary).toEqual(['Home', 'Results', 'Standings', 'Showroom', 'Engineering', 'Teams', 'Drivers']);
    expect(primary).not.toContain('Championship');
    const shared = buildNavItems('en', true);
    const results = shared.find((item) => item.id === 'results')!;
    const standings = shared.find((item) => item.id === 'standings')!;
    expect(primary).toContain(results.label);
    expect(primary).toContain(standings.label);
    expect(primary.indexOf(results.label)).toBeLessThan(primary.indexOf(standings.label));
  });

  it('does not repeat the same destination within a desktop submenu', () => {
    const html = renderAt('/');
    for (const id of ['results', 'standings']) {
      const group = html.match(new RegExp(`data-nav-id="${id}"[\\s\\S]*?id="h1-nav-dropdown-${id}"[\\s\\S]*?</div></div>`))?.[0] ?? '';
      const childLinks = [...group.matchAll(/class="h1-nav__sub"[^>]*href="([^"]+)"/g)];
      expect(childLinks.length).toBeGreaterThan(0);
      expect(new Set(childLinks.map((match) => match[1])).size).toBe(childLinks.length);
    }
  });

  it('keeps race results and the championship classifications in separate submenus', () => {
    const html = renderAt('/season/2026?tab=standings&category=drivers');
    const results = html.match(/data-nav-id="results"[\s\S]*?id="h1-nav-dropdown-results"[\s\S]*?<\/div><\/div>/)?.[0] ?? '';
    const standings = html.match(/data-nav-id="standings"[\s\S]*?id="h1-nav-dropdown-standings"[\s\S]*?<\/div><\/div>/)?.[0] ?? '';
    expect(results).toContain('Race results');
    expect(results).toContain('Calendar');
    expect(results).not.toContain('championship');
    expect(standings).toContain("Drivers&#x27; championship");
    expect(standings).toContain("Constructors&#x27; championship");
    expect(standings).not.toContain('Race results');
    expect(standings).not.toContain('Calendar');
  });

  it('renders the official PODIUM EDS logo with an accessible home label', () => {
    const html = renderAt();
    expect(html).toContain('h1-nav__brand');
    expect(html).toContain('h1-nav__brand-logo');
    expect(html).toContain('src="/logo/logo.png"');
    expect(html).toContain('srcSet="/logo/logo-optimized.webp"');
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

describe('Engineering navigation integration', () => {
  it('links directly to /engineering without requiring local trial assets', () => {
    const html = renderAt();
    expect(html).toContain('href="/engineering"');
    expect(html).not.toContain('Inside the Machine');
    expect(html).not.toContain('Engineering insights');
    expect(html).not.toContain('Previous car anatomy');
  });
});
