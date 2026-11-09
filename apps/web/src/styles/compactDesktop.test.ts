import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync('src/styles/compactDesktop.css', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const about = readFileSync('src/components/pages/AboutPage.tsx', 'utf8');

describe('PEDS editorial compact density contract', () => {
  it('loads density after index tokens and keeps semantic About scope', () => {
    expect(entry).toContain('import "./styles/compactDesktop.css"');
    expect(entry.indexOf('import "./index.css"')).toBeLessThan(
      entry.indexOf('import "./styles/compactDesktop.css"'),
    );
    expect(about).toContain('peds-about-layout');
    expect(styles).toContain('.p5-gallery-hero h1');
    expect(styles).toContain('.peds-engineering-index');
  });
  it('reflows on desktop without browser zoom, app scaling or touching Model B', () => {
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).toContain('@media (min-width: 851px) and (max-width: 1179px)');
    expect(styles).toContain('@media (max-width: 850px)');
    expect(styles).not.toMatch(/(?:^|[;\s{])zoom\s*:/);
    expect(styles).not.toContain('transform: scale(');
    expect(styles).not.toContain('ModelBShowroom');
  });
  it('preserves 200/400% text zoom and desktop control touch sizes', () => {
    expect(styles).toContain("html:not([data-text-zoom='200']):not([data-text-zoom='400'])");
    expect(styles).toContain('min-height: 44px');
    expect(styles).toContain('.h1-nav__link');
    expect(styles).toContain('.r1-cinema__scene');
    expect(styles).toContain('.eds-explore__card');
    expect(styles).toContain('.f4-table td');
  });
});
