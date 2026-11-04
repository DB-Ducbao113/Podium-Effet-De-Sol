import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = join(root, '.local-assets/p5-concepts');
const target = join(root, 'apps/web/public/images/p5/concepts-2026');
const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
if (manifest.season !== 2026 || manifest.teams.length !== 11 || manifest.drivers.length !== 22) {
  throw new Error('Unexpected F1 2026 concept manifest inventory');
}

const files = [
  ...manifest.drivers.map((entry) => entry.portrait_webp),
];
if (new Set(files).size !== 22) throw new Error('Duplicate or missing portrait paths');
const records = files.map((relative) => {
  if (!/^(teams|headshots)\/[a-z0-9-]+\.webp$/.test(relative)) throw new Error(`Unsafe concept path: ${relative}`);
  const from = join(source, relative);
  if (!existsSync(from)) throw new Error(`Missing concept source: ${relative}`);
  const bytes = readFileSync(from);
  const to = join(target, relative);
  mkdirSync(resolve(to, '..'), { recursive: true });
  copyFileSync(from, to);
  return { path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
});

for (const entry of manifest.teams) {
  const from = join(source, entry.webp);
  if (!existsSync(from)) throw new Error(`Missing team source: ${entry.webp}`);
  const { width, height } = await sharp(from).metadata();
  if (!width || !height || height < 810) throw new Error(`Unexpected team poster size: ${entry.webp}`);
  // Source posters place driver names/numbers above y=570 and a footer below
  // y=805. This crop keeps the complete car without either text region.
  const top = 570;
  const cropHeight = 235;
  const relative = `cars/${entry.name.replace('-team', '')}-car.webp`;
  const to = join(target, relative);
  mkdirSync(resolve(to, '..'), { recursive: true });
  const bytes = await sharp(from).extract({ left: 0, top, width, height: cropHeight }).webp({ quality: 84 }).toBuffer();
  writeFileSync(to, bytes);
  records.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), source: entry.webp, crop: [0, top, width, top + cropHeight] });
}

const output = join(root, 'docs/asset-manifests/f1-2026-concepts.json');
mkdirSync(resolve(output, '..'), { recursive: true });
writeFileSync(output, `${JSON.stringify({ season: 2026, source: 'owner-provided AI concept package', use: 'local visual review only', files: records }, null, 2)}\n`);
console.log(`Copied ${records.length} WebP concept assets (${records.reduce((sum, record) => sum + record.bytes, 0)} bytes)`);
