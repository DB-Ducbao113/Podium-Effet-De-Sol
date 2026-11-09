import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const contractSources = [
  'index.html',
  'src/index.css',
  'tailwind.config.js',
  'src/components/home/podiumHeroR1.css',
  'src/components/home/homepageH1.css',
  'src/components/layout/navbarH1.css',
  'src/components/championship/championshipC1.css',
  'src/components/championship/championshipC11.css',
  'src/components/championship/championshipF4.css',
  'src/components/championship/ChampionshipView.tsx',
  'src/components/ui/SectionHeading.tsx',
].map(read).join('\n');

describe('PEDS typography contract', () => {
  it('pins the four self-hosted Fontsource packages and imports the contracted families', () => {
    const packageJson = JSON.parse(read('package.json')) as { dependencies: Record<string, string> };
    expect(packageJson.dependencies['@fontsource/barlow-condensed']).toBe('5.3.0');
    expect(packageJson.dependencies['@fontsource-variable/space-grotesk']).toBe('5.3.0');
    expect(packageJson.dependencies['@fontsource-variable/manrope']).toBe('5.3.0');
    expect(packageJson.dependencies['@fontsource/ibm-plex-mono']).toBe('5.3.0');

    const main = read('src/main.tsx');
    for (const entry of [
      '@fontsource/barlow-condensed/600.css',
      '@fontsource/barlow-condensed/700.css',
      '@fontsource/barlow-condensed/800.css',
      '@fontsource-variable/space-grotesk/wght.css',
      '@fontsource-variable/manrope/wght.css',
      '@fontsource/ibm-plex-mono/500.css',
      '@fontsource/ibm-plex-mono/600.css',
    ]) expect(main).toContain(entry);
  });

  it('uses one token contract without remote fonts or legacy aliases', () => {
    expect(contractSources).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    // Only font declarations count: `data-compound="inter"` is a tyre compound,
    // not the legacy Inter family.
    expect(contractSources).not.toMatch(
      /(?:font-family|font)\s*:[^;}]*['"](?:Inter|Playfair Display|Segoe UI)['"]/i,
    );
    expect(contractSources).not.toMatch(/--font-(?:display|body|mono)\b/);
    expect(contractSources).toContain("--peds-font-display: 'Barlow Condensed'");
    expect(contractSources).toContain("--peds-font-ui: 'Space Grotesk Variable'");
    expect(contractSources).toContain("--peds-font-body: 'Manrope Variable'");
    expect(contractSources).toContain("--peds-font-mono: 'IBM Plex Mono'");
  });

  it('avoids unsupported synthetic weights on the redesigned surfaces', () => {
    expect(contractSources).not.toMatch(/font-weight:\s*(?:650|900|950)\b/);
    expect(contractSources).not.toMatch(/font:\s*(?:650|900|950)\b/);
  });

  it('keeps semantic UI and telemetry roles separate from body copy', () => {
    const globalCss = read('src/index.css');
    const championship = read('src/components/championship/championshipF4.css');
    expect(globalCss).toMatch(/\.heading-section\s*\{[^}]*font-ui/s);
    expect(globalCss).toMatch(/\.spec-value\s*\{[^}]*font-mono/s);
    expect(globalCss).toMatch(/\.nav-link\s*\{[^}]*font-ui/s);
    expect(championship).toContain('.championship-page-title { font-family: var(--peds-font-display); }');
  });
});
