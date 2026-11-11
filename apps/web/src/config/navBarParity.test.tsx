import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Navbar } from '../components/layout/Navbar';
import { buildDesktopNavItems, buildNavItems } from '../components/layout/navItems';

const read = (path: string) => readFileSync(path, 'utf8');

const desktopBar = (path = '/') => {
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><Navbar /></MemoryRouter>);
  return html.match(/<nav class="h1-nav__desktop"[\s\S]*?<\/nav>/)?.[0] ?? '';
};

describe('shared navigation bar contract', () => {
  it('keeps one ordered destination list for every bar that draws its own menu', () => {
    for (const lang of ['en', 'vi'] as const) {
      const items = buildDesktopNavItems(buildNavItems(lang, true), lang);
      expect(items.map((item) => item.id)).toEqual([
        'overview',
        'results',
        'standings',
        'showroom',
        'engineering',
        'teams',
        'drivers',
      ]);
      expect(items.map((item) => item.label)).toEqual(
        lang === 'vi'
          ? ['Trang chủ', 'Kết quả', 'Xếp hạng', 'Showroom', 'Kỹ thuật', 'Đội đua', 'Tay đua']
          : ['Home', 'Results', 'Standings', 'Showroom', 'Engineering', 'Teams', 'Drivers'],
      );
    }
  });

  it('renders the global bar from the shared destination list', () => {
    const items = buildDesktopNavItems(buildNavItems('en', true), 'en');
    const bar = desktopBar('/');
    const rendered = [...bar.matchAll(/class="h1-nav__link"[^>]*><span>([^<]+)<\/span>/g)].map((match) => match[1]);
    expect(rendered).toEqual(items.map((item) => item.label));
    for (const item of items) {
      expect(bar).toContain(`href="${item.to}"`);
    }
  });

  it('keeps the DEV Inside the Machine masthead on the shared navigation source', () => {
    const trial = read('src/dev/insideMachineI1/App.tsx');
    expect(trial).toContain("from '../../components/layout/navItems'");
    expect(trial).toContain('buildDesktopNavItems(buildNavItems(lang');
    // The trial masthead must not hardcode a competing destination list.
    expect(trial).not.toContain('href="/engineering/insights"');
    expect(trial).not.toContain('href="/engineering/car-anatomy"');
  });
});
