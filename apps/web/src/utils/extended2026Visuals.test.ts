import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../data/visualAssets/extended2026Manifest.json';
import { driverAssets, teamPrefixes } from './f1VisualAssets2026';
import { celebrationSlugs } from './extended2026Visuals';

const fileNames = new Set(manifest.files.map((file) => `${file.group}/${file.name}`));

describe('2026 extended local review package', () => {
  it('accounts for every delivered image and responsive variant', () => {
    expect(manifest.files).toHaveLength(79);
    expect(fileNames.size).toBe(79);
    expect(manifest.files.filter((file) => file.group === 'headshots')).toHaveLength(22);
    for (const kind of ['drivers', 'constructors', 'championship']) {
      expect(fileNames.has(`heroes/hero-${kind}-2026.webp`)).toBe(true);
      expect(fileNames.has(`heroes/hero-${kind}-2026-960.webp`)).toBe(true);
    }
    for (const slug of Object.values(driverAssets)) {
      expect(fileNames.has(`drivers/${slug}.webp`)).toBe(true);
      expect(fileNames.has(`headshots/${slug}-portrait.webp`)).toBe(true);
    }
    for (const prefix of Object.values(teamPrefixes)) {
      expect(fileNames.has(`teams/${prefix}-team.webp`)).toBe(true);
    }
    expect(manifest.files.filter((file) => file.group === 'celebrations')).toHaveLength(18);
    for (const slug of Object.values(celebrationSlugs)) {
      expect(fileNames.has(`celebrations/celebration-${slug}-2026.webp`)).toBe(true);
      expect(fileNames.has(`celebrations/celebration-${slug}-2026-960.webp`)).toBe(true);
    }
  });

  it('publishes exact reviewed bytes into the production public tree', () => {
    for (const asset of manifest.files) {
      expect(asset.assetStatus).toBe('NEEDS_REVIEW');
      expect(asset.sourceFile.startsWith('.local-assets/p5-review/')).toBe(true);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.publicPath.startsWith('/images/concepts-2026/')).toBe(true);
      const published = resolve(process.cwd(), '..', '..', asset.publicFile);
      expect(existsSync(published), asset.publicFile).toBe(true);
      const bytes = readFileSync(published);
      expect(bytes.length, asset.publicFile).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), asset.publicFile).toBe(asset.sha256);
    }
  });
});
