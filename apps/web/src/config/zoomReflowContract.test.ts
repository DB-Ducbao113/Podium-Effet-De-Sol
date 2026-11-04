import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const globalCss = read('src/index.css');
const championshipCss = read('src/components/championship/championshipF4.css');
const raceCenterCss = read('src/components/championship/championshipC11.css');
const standingsCss = read('src/components/championship/championshipC1.css');
const homeCss = read('src/components/home/homepageH1.css');
const heroCss = read('src/components/home/podiumHeroR1.css');
const zoomHook = read('src/hooks/useTextZoomAttribute.ts');

describe('text-only zoom reflow contract', () => {
  it('mirrors text zoom onto the document root instead of component-local probes', () => {
    expect(zoomHook).toContain('new ResizeObserver');
    expect(zoomHook).toContain("ratio >= 3 ? '400' : ratio >= 1.5 ? '200' : 'normal'");
    expect(zoomHook).toContain('root.dataset.textZoom');
  });

  it('pins page gutters and header boxes in px so chrome reflows vertically', () => {
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.page-container\s*\{\s*padding-inline:\s*12px;/);
    expect(globalCss).toMatch(/\[data-text-zoom="200"\] \.page-container\s*\{\s*padding-inline:\s*20px;/);
    expect(globalCss).toMatch(/\[data-text-zoom="200"\] \.h1-nav,\s*\[data-text-zoom="400"\] \.h1-nav\s*\{[^}]*position:\s*relative;[^}]*height:\s*auto;/s);
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.h1-nav \.h1-nav__brand-logo\s*\{\s*height:\s*64px;/);
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.footer-brand-logo\s*\{\s*height:\s*64px;/);
  });

  it('keeps every navigation destination reachable when the desktop row cannot fit', () => {
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.h1-nav__desktop\s*\{\s*display:\s*none;/);
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.h1-nav__toggle\s*\{\s*display:\s*flex;/);
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.h1-nav \.h1-nav__toggle\s*\{[^}]*min-width:\s*44px;/s);
  });

  it('wraps the tab rail at 200% and stacks it at 400% so labels stay whole', () => {
    expect(championshipCss).toMatch(
      /\[data-text-zoom="200"\] \.peds-tabs-rail,\s*\.f4-championship\[data-text-zoom="400"\] \.peds-tabs-rail\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow:\s*visible;/s,
    );
    expect(championshipCss).toMatch(
      /\[data-text-zoom="400"\] \.peds-tabs-rail > \[role="tab"\]\s*\{[^}]*flex:\s*1 1 100%;/s,
    );
    expect(championshipCss).toMatch(
      /\[data-text-zoom="200"\] \.peds-tabs-rail > \[role="tab"\],\s*\.f4-championship\[data-text-zoom="400"\] \.peds-tabs-rail > \[role="tab"\]\s*\{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*normal;/s,
    );
    expect(raceCenterCss).toMatch(
      /\[data-text-zoom="400"\] \.c11-session-tabs\s*\{[^}]*flex-wrap:\s*wrap;[^}]*overflow-x:\s*visible;/s,
    );
  });

  it('stacks the Race Center round hero at 400% without implicit grid columns', () => {
    expect(raceCenterCss).toMatch(
      /\[data-text-zoom="400"\] \.rc-round-hero\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*min-height:\s*0;/s,
    );
    expect(raceCenterCss).toMatch(
      /\[data-text-zoom="400"\] \.rc-round-copy,\s*\[data-text-zoom="400"\] \.rc-round-visual,\s*\[data-text-zoom="400"\] \.rc-round-facts\.rc-spec-rail\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*auto;/s,
    );
  });

  it('reflows the Home sections at 400% without page-level overflow', () => {
    expect(homeCss).toMatch(
      /\[data-text-zoom="400"\] \.home-latest-gp,\s*\[data-text-zoom="400"\] \.h25-overview,\s*\[data-text-zoom="400"\] \.h1-countdown\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    );
    expect(homeCss).toMatch(
      /\[data-text-zoom="400"\] \.home-latest-gp__classification\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*overflow-x:\s*auto;/s,
    );
    expect(homeCss).toMatch(
      /\[data-text-zoom="400"\] \.home-section-title,\s*\[data-text-zoom="400"\] \.home-latest-gp__title,\s*\[data-text-zoom="400"\] \.h1-countdown h2\s*\{\s*font-size:\s*34px;/s,
    );
    expect(homeCss).toMatch(
      /\[data-text-zoom="400"\] \.h1-countdown__sessions\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    );
  });

  it('stacks the phone race schedule at 200% so scaled session labels stay on screen', () => {
    expect(homeCss).toMatch(
      /@media \(max-width: 767px\) \{\s*\[data-text-zoom="200"\] \.h1-countdown__sessions\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    );
    expect(homeCss).toMatch(
      /\[data-text-zoom="200"\] \.h1-countdown__session\s*\{\s*padding:\s*16px;/s,
    );
    expect(homeCss).toMatch(
      /\[data-text-zoom="200"\] \.h1-countdown__session :is\(small, strong, time\)\s*\{\s*overflow-wrap:\s*anywhere;/s,
    );
  });

  it('keeps Launch Control type and navigation usable at 400% text zoom', () => {
    expect(heroCss).toMatch(
      /\[data-text-zoom='400'\] \.r1-cinema__inner\s*\{[^}]*min-height:\s*0;/s,
    );
    expect(heroCss).toMatch(
      /\[data-text-zoom='400'\] \.r1-cinema__title\s*\{[^}]*font-size:\s*37px;[^}]*letter-spacing:\s*0;/s,
    );
    expect(heroCss).toMatch(
      /\[data-text-zoom='400'\] \.r1-cinema__actions\s*\{[^}]*flex-direction:\s*column;/s,
    );
    expect(heroCss).toMatch(
      /\[data-text-zoom='400'\] \.r1-cinema__launch,\s*\[data-text-zoom='400'\] \.r1-cinema__chapters\s*\{\s*display:\s*none;/s,
    );
  });

  it('reflows the embedded standings panel at 400% instead of letting overflow hide its body', () => {
    expect(standingsCss).toMatch(
      /\[data-text-zoom='400'\] \.c1-standings \.c1-section-head\s*\{[^}]*flex-direction:\s*column;[^}]*padding:\s*16px;/s,
    );
    expect(standingsCss).toMatch(
      /\[data-text-zoom='400'\] \.c1-standings \.c1-section-head h2\s*\{\s*font-size:\s*32px;/s,
    );
    expect(standingsCss).toMatch(
      /\[data-text-zoom='400'\] \.c1-standings-list\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/s,
    );
    expect(standingsCss).toMatch(
      /\[data-text-zoom='400'\] \.c1-standings-list \.c1-standing-row,\s*\[data-text-zoom='400'\] \.c1-standings-list \.c1-standing-row:nth-child\(-n \+ 3\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);[^}]*min-height:\s*0;/s,
    );
  });
});
