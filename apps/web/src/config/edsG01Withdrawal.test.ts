import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function collectFiles(dir: string, match: (name: string) => boolean): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(full, match));
    else if (match(entry.name)) found.push(full);
  }
  return found;
}

describe('EDS-G01 active-experience withdrawal (10/11/2026)', () => {
  it('removes the dead EDS-G01 studio backdrop modules from source', () => {
    expect(existsSync('src/components/showroom/StudioW15Stage.tsx')).toBe(false);
    expect(existsSync('src/components/showroom/EDSStudioBackdropTexture.ts')).toBe(false);
  });

  it('removes the dead EDS-G01 public assets and their empty directories', () => {
    expect(existsSync('public/images/showroom/eds-g01')).toBe(false);
    expect(existsSync('public/images/eds/editorial/eds-g01-hero.svg')).toBe(false);
    expect(existsSync('public/images/eds/editorial')).toBe(false);
  });

  it('keeps every active (non-test) source file free of EDS-G01 labels', () => {
    const files = collectFiles(
      'src',
      (name) =>
        SOURCE_EXTENSIONS.includes(path.extname(name)) &&
        !name.includes('.test.') &&
        !name.includes('.spec.'),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), `${file} must not reference EDS-G01`).not.toMatch(
        /eds-g01/i,
      );
    }
  });

  it('keeps the used original EDS artwork free of EDS-G01 labels', () => {
    const svgs = collectFiles('public/images/eds', (name) => name.endsWith('.svg'));
    expect(svgs.length).toBeGreaterThan(0);
    for (const file of svgs) {
      expect(readFileSync(file, 'utf8'), `${file} must not reference EDS-G01`).not.toMatch(
        /eds-g01/i,
      );
    }
  });

  it('keeps the HTML shell, SEO prerender and design dossier free of EDS-G01 labels', () => {
    const shell = readFileSync('index.html', 'utf8');
    expect(shell).not.toMatch(/eds-g01/i);
    expect(shell).toContain('original Podium EDS technical content');
    const prerender = readFileSync('scripts/prerender-engineering.mjs', 'utf8');
    expect(prerender).not.toMatch(/eds-g01/i);
    const dossier = '.impeccable/surfaces/apps-web-src-components-home-podiumbrandhero-tsx.md';
    if (existsSync(dossier)) {
      expect(readFileSync(dossier, 'utf8')).not.toMatch(/eds-g01/i);
    }
  });

  it('prunes the retired EDS-G01 directories instead of requiring them as assets', () => {
    const prune = readFileSync('scripts/prune-legacy-showroom-assets.mjs', 'utf8');
    expect(prune).toContain("'dist/images/showroom/eds-g01'");
    expect(prune).toContain("'dist/images/eds/editorial'");
    expect(prune).not.toContain('dist/images/showroom/eds-g01/schematic.svg');
    expect(prune).not.toContain('dist/images/eds/editorial/eds-g01-hero.svg');
  });

  it('preserves the historical EDS-G01 withdrawal provenance', () => {
    expect(existsSync('../../docs/asset-manifests/p4-eds-g01-withdrawn.json')).toBe(true);
    expect(readFileSync('public/models/README.md', 'utf8')).toMatch(/EDS-G01/);
    expect(readFileSync('../../docs/asset-licenses.md', 'utf8')).toContain(
      'P4 cinematic plates — WITHDRAWN',
    );
  });
});