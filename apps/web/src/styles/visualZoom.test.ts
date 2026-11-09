import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { textZoomLevel } from '../hooks/useTextZoomAttribute';

const styles = readFileSync('src/styles/visualZoom.css', 'utf8');
const density = readFileSync('src/styles/densityV2.css', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const GUARD = "html:not([data-text-zoom='200']):not([data-text-zoom='400'])";
const TOKEN = 'var(--peds-visual-zoom)';

const cssFiles = (() => {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.css')) found.push(p);
    }
  };
  walk('src');
  return found;
})();

/** Sizes that must reach a screen edge divide by the scale; mobile bands do not need to. */
const uncompensated = (file: string) => {
  const lines = readFileSync(file, 'utf8').split('\n');
  let band = '';
  let depth = 0;
  return lines.filter((raw) => {
    const line = raw.trim();
    if (!band && line.startsWith('@media')) band = line;
    depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
    if (depth <= 0) band = '';
    if (line.startsWith('@') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('//')) return false;
    if (/max-width/.test(band)) return false;
    return [...line.matchAll(/(-?\d*\.?\d+)(?:vw|vh|svh|lvh|dvh|vmin|vmax)\b/g)].some(
      (m) => !line.slice((m.index ?? 0) + m[0].length).startsWith(` / ${TOKEN}`),
    );
  });
};

describe('VISUAL-ZOOM-01 default 75% desktop composition', () => {
  it('loads last so it wins the cascade over the density layers', () => {
    expect(entry.indexOf('import "./styles/densityV2.css"')).toBeLessThan(
      entry.indexOf('import "./styles/visualZoom.css"'),
    );
  });

  it('scales only when zoom is supported, on desktop, and outside text zoom 200/400%', () => {
    expect(styles).toContain('@supports (zoom: 0.75)');
    expect(styles).toContain('@media (min-width: 1180px)');
    expect(styles).toContain(`${GUARD} {\n      --peds-visual-zoom: 0.75;\n      zoom: var(--peds-visual-zoom);`);
  });

  it('keeps the token neutral at 1 wherever the scale is off', () => {
    expect(styles).toMatch(/:root\s*\{\s*--peds-visual-zoom: 1;\s*\}/);
    expect(styles.match(/--peds-visual-zoom:\s*[^;]+;/g)).toEqual([
      `--peds-visual-zoom: 1;`,
      `--peds-visual-zoom: 0.75;`,
    ]);
  });

  it('stops the Density-02 rem compact from multiplying with the scale', () => {
    const block = styles.match(/html:not\(\[data-text-zoom='200'\]\):not\(\[data-text-zoom='400'\]\)\s*\{[^}]*zoom: var\(--peds-visual-zoom\);[^}]*\}/)?.[0] ?? '';
    expect(block).toContain('font-size: 100%;');
    // Density-02 keeps its own 75% rem base for the unzoomed bands.
    expect(density).toContain('font-size: 75%;');
    // 16px base x 0.75 scale renders the same 12px body copy as before the scale.
    expect(16 * 0.75).toBeCloseTo(12);
  });

  it('compensates the viewport utilities that have to reach a screen edge', () => {
    for (const utility of ['.min-h-screen', '.h-dvh', '.max-h-dvh', '.w-screen', '.min-w-screen']) {
      expect(styles).toContain(utility);
    }
    expect(styles).toContain(`min-height: calc(100vh / ${TOKEN});`);
    expect(styles).toContain(`width: calc(100vw / ${TOKEN});`);
  });

  it('mirrors the desktop media bands that a faked zoom cannot cross', () => {
    expect(styles).toContain(`${GUARD} .p5-gallery-page .p5-driver-grid`);
    expect(styles).toContain('grid-template-columns: repeat(5, minmax(0, 1fr));');
    expect(styles).toContain('@media (min-width: 1200px)');
    expect(styles).toContain(`${GUARD} .f1hero {\n        --f1-fit-scale: .94;`);
  });

  it('divides every viewport unit outside mobile bands by the token', () => {
    const offenders = cssFiles.filter((file) => file !== 'src' + path.sep + 'styles' + path.sep + 'visualZoom.css' && uncompensated(file).length);
    expect(offenders).toEqual([]);
  });

  it('reads text zoom thresholds against the scaled base', () => {
    expect(textZoomLevel(16, 1)).toBe('normal');
    expect(textZoomLevel(24, 1)).toBe('200');
    expect(textZoomLevel(48, 1)).toBe('400');
    expect(textZoomLevel(12, 0.75)).toBe('normal');
    expect(textZoomLevel(18, 0.75)).toBe('200');
    expect(textZoomLevel(36, 0.75)).toBe('400');
    expect(textZoomLevel(0, 0.75)).toBe('normal');
  });

  it('sizes 3D canvases from layout pixels, which is what zoom scales', () => {
    for (const file of [
      'src/components/championship/JourneyGlobe3D.tsx',
      'src/components/home/aerocore/AeroCanvas.tsx',
      'src/components/home/world/HomeWorldCanvas.tsx',
      'src/components/showroom/ModelBShowroom.tsx',
    ]) expect(readFileSync(file, 'utf8')).toContain('resize={{ offsetSize: true }}');
  });
});
