import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync('src/styles/densityV2.css', 'utf8');
const heroStyles = readFileSync('src/components/home/homeHeroV7.css', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const article = readFileSync('src/components/engineering/EngineeringArticlePage.tsx', 'utf8');
const car = readFileSync('src/components/pages/CarDetailPage.tsx', 'utf8');

describe('Density-02 stronger site-wide compact pass', () => {
  it('loads later than Density-01 and exposes a readable CSS version probe', () => {
    expect(entry).toContain('import "./styles/densityV2.css"');
    expect(entry.indexOf('import "./styles/compactDesktop.css"')).toBeLessThan(
      entry.indexOf('import "./styles/densityV2.css"'),
    );
    expect(styles).toContain('--peds-density-version: 2');
    expect(styles).toContain('--peds-hero-stage-safety: 1');
    expect(heroStyles).toContain('min-height: max(720px, calc(100svh / var(--peds-visual-zoom) - 56px))');
    expect(styles).not.toContain('min-height: clamp(500px, 57svh, 620px)');
    expect(styles).not.toContain('min-height: clamp(335px, 43svh, 435px)');
  });

  it('applies the 75% desktop scale to inherited text', () => {
    expect(styles).toContain('font-size: 75%;');
    expect(styles).toContain('font-size: 1rem;');
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).toContain("html:not([data-text-zoom='200']):not([data-text-zoom='400'])");
    expect(styles).not.toMatch(/(?:^|[;\s{])zoom\s*:/);
    expect(styles).not.toMatch(/transform\s*:\s*scale\(/);
    expect(styles).not.toContain('.rcj-map-stage {');
    expect(styles).not.toContain('.peds-compact-studio__canvas {');
  });

  it('does not clip the F1 vehicle or alpha layers while compacting content', () => {
    expect(styles).toContain('.home-pulse.home-pulse--f1hero');
    expect(styles).toContain('mask-image: none');
    expect(styles).toContain('height: 305px');
  });

  it('addresses all major giant desktop heroes, card systems and article pages', () => {
    for (const selector of [
      '.r1-cinema--v7', '.home-rc__next', '.eds-explore__card',
      '.p5-mega', '.p5-profile-hero', '.p5-podium-card',
      '.p5-gallery-hero', '.c1-standing-row:nth-child(-n + 3)',
      '.anatomy-hero', '.anatomy-chapter', '.peds-footer__main',
      '.peds-engineering-article', '.peds-car-detail',
    ]) expect(styles).toContain(selector);
    expect(article).toContain('peds-engineering-article');
    expect(car).toContain('peds-car-detail');
  });

  it('guards the 200/400% accessibility zoom and keeps 44px navbar controls', () => {
    expect(styles).toContain("html:not([data-text-zoom='200']):not([data-text-zoom='400'])");
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).toContain('@media (min-width: 1024px) and (max-width: 1179px)');
    expect(styles).toContain('min-height: 44px');
  });
});
