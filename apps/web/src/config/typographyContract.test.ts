import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(css|ts|tsx)$/.test(entry.name) ? [full] : [];
  });

const isTestFile = (file: string) => /\.(test|spec)\.(ts|tsx)$/.test(file);

const styleFiles = walk('src').filter((file) => !isTestFile(file));
const cssFiles = styleFiles.filter((file) => file.endsWith('.css'));
const cssText = cssFiles.map(read).join('\n');
const allText = styleFiles.map(read).join('\n');
const globalCss = read('src/index.css');
const tailwindConfig = read('tailwind.config.js');

const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe('PEDS typography contract', () => {
  it('ships six self-hosted expressive, soft, and readable font families', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      dependencies: Record<string, string>;
    };
    expect(packageJson.dependencies['@fontsource/corinthia']).toBeTruthy();
    expect(packageJson.dependencies['@fontsource-variable/dancing-script']).toBeTruthy();
    expect(packageJson.dependencies['@fontsource-variable/cormorant-garamond']).toBeTruthy();
    expect(packageJson.dependencies['@fontsource-variable/quicksand']).toBeTruthy();
    expect(packageJson.dependencies['@fontsource-variable/nunito']).toBeTruthy();
    expect(packageJson.dependencies['@fontsource/ibm-plex-mono']).toBe('5.3.0');
    expect(packageJson.dependencies['@fontsource-variable/lexend']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource-variable/lora']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource/be-vietnam-pro']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource-variable/plus-jakarta-sans']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource-variable/manrope']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource/barlow-condensed']).toBeUndefined();
    expect(packageJson.dependencies['@fontsource-variable/space-grotesk']).toBeUndefined();

    const main = read('src/main.tsx');
    for (const entry of [
      '@fontsource/corinthia/400.css',
      '@fontsource/corinthia/700.css',
      '@fontsource-variable/dancing-script/wght.css',
      '@fontsource-variable/cormorant-garamond/wght.css',
      '@fontsource-variable/quicksand/wght.css',
      '@fontsource-variable/nunito/wght.css',
      '@fontsource/ibm-plex-mono/500.css',
      '@fontsource/ibm-plex-mono/600.css',
    ]) {
      expect(main).toContain(entry);
    }
    expect(main).not.toMatch(/barlow-condensed|space-grotesk|plus-jakarta-sans|manrope|lexend|lora|be-vietnam-pro/i);
  });

  it('uses one token contract without remote fonts or legacy aliases', () => {
    expect(allText).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
    expect(allText).not.toMatch(/\b(?:Barlow Condensed|Space Grotesk|Plus Jakarta Sans|Manrope|Lexend|Lora|Be Vietnam Pro)\b/i);
    // Canvas textures intentionally paint with system UI faces; only stylesheet
    // font declarations are bound by the family contract.
    expect(cssText).not.toMatch(
      /(?:font-family|font)\s*:[^;}]*['"](?:Inter|Playfair Display|Segoe UI)['"]/i,
    );
    expect(allText).not.toMatch(/--font-(?:display|body|mono)\b/);

    expect(globalCss).toContain("--peds-font-script: 'Corinthia'");
    expect(globalCss).toContain("--peds-font-hand: 'Dancing Script Variable'");
    expect(globalCss).toContain("--peds-font-editorial: 'Cormorant Garamond Variable'");
    expect(globalCss).toContain("--peds-font-display: 'Quicksand Variable'");
    expect(globalCss).toContain("--peds-font-ui: 'Quicksand Variable'");
    expect(globalCss).toContain("--peds-font-body: 'Nunito Variable'");
    expect(globalCss).toContain("--peds-font-mono: 'IBM Plex Mono'");
  });

  it('drops synthetic italic and weights the shipped face does not carry', () => {
    expect(cssText).not.toMatch(/font-style\s*:\s*(?:italic|oblique)/);
    expect(cssText).not.toMatch(/font\s*:\s*(?:italic|oblique)\b/);
    expect(cssText).not.toMatch(/font-weight\s*:\s*(?:801|850|900|950)\b/);
    expect(cssText).not.toMatch(/font\s*:\s*(?:801|850|900|950)\b/);
    // `font-black` must not ask for a weight the variable axis cannot render.
    expect(tailwindConfig).toMatch(/fontWeight:\s*\{\s*black:\s*'800'/);
  });

  it('keeps one ignition accent with a readable soft tone and a wash tone', () => {
    expect(globalCss).toContain('--peds-flame-500: #ff4a18');
    expect(globalCss).toContain('--peds-color-accent: var(--peds-flame-500)');
    expect(globalCss).toContain('--peds-color-accent-strong: var(--peds-flame-400)');
    expect(globalCss).toContain('--peds-color-accent-soft: var(--peds-flame-300)');
    expect(globalCss).toContain('--peds-color-accent-wash: var(--peds-flame-wash)');

    expect(contrast('#ff4a18', '#08090c')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ff8a5c', '#08090c')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#a8afb9', '#08090c')).toBeGreaterThanOrEqual(4.5);
  });

  it('publishes one type scale and one section rhythm', () => {
    expect(globalCss).toContain('--peds-text-label: 0.75rem');
    expect(globalCss).toContain('--peds-section-y: clamp(');
    expect(globalCss).toContain('--peds-grid-gutter: clamp(');

    expect(globalCss).toMatch(/\.page-section\s*\{[^}]*--peds-section-y/s);
    expect(globalCss).toMatch(/\.label-overline\s*\{[^}]*text-peds-label/s);
    expect(globalCss).toMatch(/\.peds-eyebrow\s*\{[^}]*--peds-text-label/s);
    // Eyebrows and overlines are muted so the accent stays a deliberate accent.
    expect(globalCss).toMatch(/\.peds-eyebrow\s*\{[^}]*text-peds-text-muted/s);
    expect(globalCss).toMatch(/\.label-overline\s*\{[^}]*text-peds-text-muted/s);
  });

  it('keeps semantic UI, editorial and telemetry roles separate from body copy', () => {
    expect(globalCss).toMatch(/\.heading-section\s*\{[^}]*font-ui/s);
    expect(globalCss).toMatch(/\.editorial-title\s*\{[^}]*font-editorial/s);
    expect(globalCss).toMatch(/\.spec-value\s*\{[^}]*font-mono/s);
    expect(globalCss).toMatch(/\.nav-link\s*\{[^}]*font-ui/s);
    expect(read('src/components/championship/championshipF4.css')).toContain(
      '.championship-page-title { font-family: var(--peds-font-display); }',
    );
  });

  it('puts canvas ink on every ignition accent fill', () => {
    // White on the ignition orange measures 3.36:1. Any accent surface must
    // carry the carbon ink instead, including on hover.
    const restingFill = /(?:^|[\s"'`])bg-(?:f1red|peds-ignition)(?![\w/-])/;
    const anyFill = /(?:^|[\s"'`])(?:hover:)?bg-(?:f1red|peds-ignition)(?![\w/-])/;
    const whiteLabel = /(?<![\w:])text-white(?![\w-])/;
    const whiteLabelOnHover = /(?<![\w-])hover:text-white(?![\w-])/;

    const violations: string[] = [];
    for (const file of styleFiles.filter((entry) => entry.endsWith('.tsx'))) {
      for (const fragment of read(file).split(/['"`]/)) {
        if (!/bg-(?:f1red|peds-ignition)/.test(fragment)) continue;
        if (restingFill.test(fragment) && whiteLabel.test(fragment)) {
          violations.push(`${file}: ${fragment.trim().slice(0, 90)}`);
        }
        if (anyFill.test(fragment) && whiteLabelOnHover.test(fragment)) {
          violations.push(`${file}: ${fragment.trim().slice(0, 90)}`);
        }
      }
    }
    expect(violations).toEqual([]);

    expect(globalCss).toMatch(/\.r1-primary \.bg-f1red\s*\{[^}]*--peds-color-carbon/s);
    expect(read('src/components/championship/mini-race/mini-race.css')).toMatch(
      /\.mini-race__rank\s*\{[^}]*color:\s*var\(--peds-color-text\)/s,
    );
  });

  it('never reaches for the italic element in production markup', () => {
    // <i> carries a user-agent italic style, so any glyph placed inside it
    // inherits a synthetic slant the stylesheet never asked for. Decorative
    // shapes use <span> instead.
    const offenders = styleFiles
      .filter((file) => file.endsWith('.tsx'))
      .filter((file) => !file.replace(/\\/g, '/').includes('src/dev/'))
      .filter((file) => /<i[\s/>]/.test(read(file)))
      .map((file) => file.replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });
});
