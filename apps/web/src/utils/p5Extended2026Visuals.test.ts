import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../data/visualAssets/p5Extended2026Manifest.json';
import { driverAssets, teamPrefixes } from './f1VisualAssets2026';
import { celebrationSlugs } from './p5Extended2026Visuals';

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

  it('serves only exact reviewed source bytes outside the public tree when present', () => {
    for (const asset of manifest.files) {
      expect(asset.assetStatus).toBe('NEEDS_REVIEW');
      expect(asset.sourceFile.startsWith('.local-assets/p5-review/')).toBe(true);
      const file = resolve(process.cwd(), '../..', asset.sourceFile);
      expect(asset.bytes).toBeGreaterThan(0);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      if (asset.group === 'headshots') {
        const existing = readFileSync(resolve(process.cwd(), 'public/images/p5/concepts-2026/headshots', asset.name));
        expect(createHash('sha256').update(existing).digest('hex')).toBe(asset.sha256);
      }
      if (process.env.PEDS_VERIFY_LOCAL_ASSETS === '1') expect(existsSync(file), asset.sourceFile).toBe(true);
      if (!existsSync(file)) continue;
      const bytes = readFileSync(file);
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    }
  });
});
