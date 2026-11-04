import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';
import { useNavigationStore } from '../../store/useNavigationStore';

const css = readFileSync('src/index.css', 'utf8');

const tokenDeclarations = new Map<string, string>();
for (const match of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
  tokenDeclarations.set(match[1], match[2].trim());
}

function token(name: string): string {
  const value = tokenDeclarations.get(name);
  if (!value) throw new Error(`Missing token --${name}`);
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  return alias ? token(alias[1]) : value;
}

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.04045 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((offset) =>
    channel(Number.parseInt(value.slice(offset, offset + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

const renderAbout = (lang: 'en' | 'vi') => {
  useNavigationStore.setState({ lang });
  return renderToStaticMarkup(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
};

describe('About page display heading', () => {
  beforeEach(() => useNavigationStore.setState({ lang: 'en' }));

  it.each(['en', 'vi'] as const)(
    'uses the shared display primitive on the real dark canvas (%s)',
    (lang) => {
      const html = renderAbout(lang);
      expect(html).toContain('peds-display-page');
      expect(html).not.toContain('text-studio-950');
    },
  );

  it('keeps ivory heading text above 4.5:1 on the canvas', () => {
    expect(contrast(token('peds-color-text'), token('peds-color-canvas'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('IGNITION palette contract', () => {
  it('keeps the approved canonical values and pairings legible', () => {
    expect(token('peds-color-carbon')).toBe('#0a0c10');
    expect(token('peds-color-ignition')).toBe('#ff4a18');
    expect(token('peds-color-racing-red')).toBe('#e51b37');
    expect(token('peds-color-ivory')).toBe('#f4f0e8');
    expect(token('peds-color-signal')).toBe('#b7ff37');

    expect(contrast(token('peds-color-carbon'), token('peds-color-ignition'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', token('peds-color-racing-red'))).toBeGreaterThanOrEqual(4.5);
  });

  it('publishes the focus, spacing and motion token contract', () => {
    for (const name of [
      'peds-grid-gutter',
      'peds-border-hairline',
      'peds-focus-ring-width',
      'peds-focus-ring-offset',
      'peds-focus-ring-color',
      'peds-motion-reduced',
    ]) {
      expect(tokenDeclarations.has(name)).toBe(true);
    }
  });
});
