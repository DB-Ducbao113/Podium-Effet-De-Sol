/**
 * P5-R0 local-only asset audit and safe preview installer.
 *
 * From repository root:
 *   node tools/p5-audit-local-assets.mjs
 *   node tools/p5-audit-local-assets.mjs --install
 *   node tools/p5-audit-local-assets.mjs --install --source-root "E:\\Formula 1\\Podium-Effet-De-Sol"
 *
 * --install copies only checksum-verified owner assets to ignored public paths.
 * It never overwrites an existing file, deletes source files or publishes them.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, copyFileSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const sourceRootIndex = process.argv.indexOf('--source-root');
const sourceRoot = sourceRootIndex >= 0
  ? resolve(process.argv[sourceRootIndex + 1] ?? '')
  : root;
if (sourceRootIndex >= 0 && (!process.argv[sourceRootIndex + 1] || !existsSync(sourceRoot))) {
  throw new Error('--source-root must point to an existing original repository directory.');
}
const manifest = JSON.parse(readFileSync(join(root, 'apps/web/src/data/visualAssets/p5Extended2026Manifest.json'), 'utf8'));
const names = readFileSync(join(root, 'apps/web/src/utils/f1VisualAssets2026.ts'), 'utf8');
const mode = process.argv.includes('--install') ? 'install' : 'audit';
const output = join(root, '.local-assets', 'p5-r0', 'asset-audit.json');

const groupFolder = {
  drivers: '__p5-extra-2026/drivers',
  headshots: 'images/p5/concepts-2026/headshots',
  teams: '__p5-extra-2026/teams',
  heroes: '__p5-extra-2026/heroes',
  celebrations: '__p5-extra-2026/celebrations',
};
function readMappings(name) {
  const match = names.match(new RegExp('export const ' + name + ' = \\{([\\s\\S]*?)\\} as const'));
  if (!match) throw new Error('Cannot find source mapping: ' + name);
  return Object.fromEntries(
    Array.from(match[1].matchAll(/([a-z]+):\s*'([^']+)'/g), (m) => [m[1], m[2]]),
  );
}
const driverAssets = readMappings('driverAssets');
const teamPrefixes = readMappings('teamPrefixes');
const driverSlugToId = Object.fromEntries(Object.entries(driverAssets).map(([id, slug]) => [slug, id]));
const teamPrefixToId = Object.fromEntries(Object.entries(teamPrefixes).map(([id, prefix]) => [prefix, id]));

function checksum(pathname) {
  return createHash('sha256').update(readFileSync(pathname)).digest('hex').toLowerCase();
}
function inspect(entry) {
  const publicPath = 'apps/web/public/' + groupFolder[entry.group] + '/' + entry.name;
  const sourcePath = entry.sourceFile;
  const destination = resolve(root, publicPath);
  const source = resolve(sourceRoot, sourcePath);
  let status = 'missing';
  const destinationPresent = existsSync(destination);
  const sourcePresent = existsSync(source);
  const expectedHash = entry.sha256.toLowerCase();
  if (destinationPresent) {
    status = checksum(destination) === expectedHash ? 'ready' : 'hash-mismatch-public';
  } else if (sourcePresent) {
    const sourceHash = checksum(source);
    status = sourceHash === expectedHash && statSync(source).size === entry.bytes
      ? 'source-ready'
      : 'hash-mismatch-source';
    if (mode === 'install' && status === 'source-ready') {
      mkdirSync(dirname(destination), { recursive: true });
      // Explicitly refuse to overwrite, even if another process added the file.
      if (!existsSync(destination)) {
        copyFileSync(source, destination);
        status = checksum(destination) === expectedHash ? 'installed' : 'hash-mismatch-installed';
      }
    }
  }
  const slug = entry.name.replace(/-portrait\.webp$/, '').replace(/\.webp$/, '');
  const driverId = entry.group === 'drivers' || entry.group === 'headshots'
    ? driverSlugToId[slug] ?? null : null;
  const teamId = entry.group === 'teams'
    ? teamPrefixToId[slug.replace(/-team$/, '')] ?? null : null;
  return {
    group: entry.group, name: entry.name, driverId, teamId,
    publicPath: publicPath.split(sep).join('/'),
    sourcePath: sourcePath.split(sep).join('/'),
    destinationPresent, sourcePresent, status,
    expectedBytes: entry.bytes, expectedSha256: expectedHash,
    assetStatus: entry.assetStatus,
  };
}

if (Object.keys(driverAssets).length !== 22 || Object.keys(teamPrefixes).length !== 11) {
  throw new Error('Expected 22 main drivers and 11 constructors in the 2026 concept mapping.');
}
const rows = manifest.files.map(inspect);
const summary = Object.fromEntries(Object.keys(groupFolder).map((group) => {
  const selected = rows.filter((row) => row.group === group);
  return [group, {
    expected: selected.length,
    ready: selected.filter((row) => ['ready', 'installed'].includes(row.status)).length,
    sourceReady: selected.filter((row) => row.status === 'source-ready').length,
    missing: selected.filter((row) => row.status === 'missing').length,
    mismatches: selected.filter((row) => row.status.startsWith('hash-mismatch')).length,
  }];
}));

// Optional concept cars are from a DIFFERENT owner-local pack and are not
// enumerated in the extended 2026 manifest. Do not claim we verified them.
const conceptCars = Object.entries(teamPrefixes).map(([id, prefix]) => ({
  teamId: id,
  publicPath: 'apps/web/public/images/p5/concepts-2026/cars/' + prefix + '-car.webp',
  present: existsSync(join(root, 'apps/web/public/images/p5/concepts-2026/cars', prefix + '-car.webp')),
}));
const report = {
  mode, sourceRoot, generatedAt: new Date().toISOString(),
  note: 'Local audit only; unapproved artwork remains ignored and never uploaded by this command.',
  expectedMainDrivers: Object.keys(driverAssets),
  expectedTeams: Object.keys(teamPrefixes),
  summary, files: rows, conceptCars,
};
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log('P5 local image audit | ' + mode + ' | 2026 drivers=' +
  Object.keys(driverAssets).length + ', teams=' + Object.keys(teamPrefixes).length);
for (const [group, count] of Object.entries(summary)) {
  console.log('  ' + group.padEnd(14) + ' ' + count.ready + '/' + count.expected + ' served, ' +
    count.sourceReady + ' source-only, ' + count.missing + ' absent, ' + count.mismatches + ' mismatched');
}
const problemDrivers = rows.filter((row) =>
  (row.group === 'drivers' || row.group === 'headshots') &&
  !['ready', 'installed'].includes(row.status));
if (problemDrivers.length) {
  console.log('\nDrivers requiring attention (the local report provides exact filenames):');
  for (const item of problemDrivers) {
    console.log('  ' + String(item.driverId ?? 'unknown').padEnd(14) + ' ' +
      item.group.padEnd(10) + ' ' + item.status.padEnd(22) + ' ' + item.name);
  }
}
const missingCars = conceptCars.filter((car) => !car.present);
console.log('\nOptional concept cars (separate owner pack): ' +
  (conceptCars.length - missingCars.length) + '/' + conceptCars.length +
  '. Team Garage can use validated team posters or driver portraits instead.');
console.log('\nFull JSON report: ' + relative(root, output));
if (mode === 'install') {
  console.log('No existing images were overwritten. Source assets were not modified.');
}
if (rows.some((row) => row.status.startsWith('hash-mismatch'))) {
  console.error('WARNING: checksum mismatch. These files were NOT overwritten.');
  process.exitCode = 1;
}
