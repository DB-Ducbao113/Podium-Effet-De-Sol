import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync('src/styles/densityV2.css', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const article = readFileSync('src/components/engineering/EngineeringArticlePage.tsx', 'utf8');

describe('Density-02 site-wide compact pass', () => {
  it('loads later than Density-01 and exposes a readable CSS version probe', () => {
    expect(entry).toContain('import "./styles/densityV2.css"');
    expect(entry.indexOf('import "./styles/compactDesktop.css"')).toBeLessThan(
      entry.indexOf('import "./styles/densityV2.css"'),
    );
    expect(styles).toContain('--peds-density-version: 2');
  });

  it('applies the 75% desktop scale to inherited text without CSS zoom or transform scale', () => {
    expect(styles).toContain('font-size: 75%;');
    expect(styles).toContain('font-size: 1rem;');
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).toContain("html:not([data-text-zoom='200']):not([data-text-zoom='400'])");
    expect(styles).not.toMatch(/(?:^|[;\s{])zoom\s*:/);
    expect(styles).not.toMatch(/transform\s*:\s*scale\(/);
    expect(article).toContain('peds-engineering-article');
  });
});
