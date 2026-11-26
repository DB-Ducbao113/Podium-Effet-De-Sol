import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync('src/styles/compactDesktop.css', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const about = readFileSync('src/components/storm/StormAboutView.tsx', 'utf8');

describe('PEDS editorial compact density contract', () => {
  it('loads density after index tokens and keeps semantic About scope', () => {
    expect(entry).toContain('import "./styles/compactDesktop.css"');
    expect(entry.indexOf('import "./index.css"')).toBeLessThan(
      entry.indexOf('import "./styles/compactDesktop.css"'),
    );
    expect(about).toContain('data-prototype-tab="about"');
  });

  it('reflows on desktop without browser zoom or CSS transform scaling', () => {
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).not.toMatch(/(?:^|[;\s{])zoom\s*:/);
    expect(styles).not.toContain('transform: scale(');
  });

  it('preserves 200/400% text zoom and 44px desktop control touch sizes', () => {
    expect(styles).toContain("html:not([data-text-zoom='200']):not([data-text-zoom='400'])");
    expect(styles).toContain('min-height: 44px');
  });
});
