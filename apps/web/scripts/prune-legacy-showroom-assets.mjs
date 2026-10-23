import fs from 'node:fs/promises';
import path from 'node:path';

const legacyTargets = [
  'dist/models/c42.v2.glb',
  'dist/textures/wheel_base.webp',
  'dist/images/showroom/closeups',
  'dist/images/showroom/schematics',
  'dist/images/showroom/wings_drs.webp',
  'dist/images/showroom/power_unit.webp',
  'dist/images/showroom/pirelli_tires.webp',
  'dist/images/showroom/halo_safety.webp',
  'dist/images/showroom/sidepods_cooling.webp',
  'dist/images/teams',
  'dist/images/drivers',
  'dist/images/circuits',
  'dist/images/podium-diffuser-hero-v2.webp',
  'dist/dev-showroom.html',
];
const reviewOnlyTargets = ['dist/models/eds-g02.glb', 'dist/models/eds-g03-preview.glb'];
const originalTeamStudies = [
  'ferrari',
  'mclaren',
  'redbull',
  'mercedes',
  'astonmartin',
  'alpine',
  'racingbulls',
  'haas',
  'williams',
  'audi',
  'cadillac',
];
const originalDriverProfiles = [
  'leclerc',
  'hamilton',
  'norris',
  'piastri',
  'verstappen',
  'hadjar',
  'russell',
  'antonelli',
  'alonso',
  'stroll',
  'gasly',
  'colapinto',
  'lawson',
  'lindblad',
  'ocon',
  'bearman',
  'sainz',
  'albon',
  'hulkenberg',
  'bortoleto',
  'perez',
  'bottas',
  'tsunoda',
  'ricciardo',
  'magnussen',
  'zhou',
  'sargeant',
  'doohan',
];
const requiredOriginalAssets = [
  'dist/models/eds-g01.glb',
  'dist/images/showroom/eds-g01/schematic.svg',
  'dist/images/showroom/eds-g01/wings.svg',
  'dist/images/showroom/eds-g01/drs.svg',
  'dist/images/showroom/eds-g01/power_unit.svg',
  'dist/images/showroom/eds-g01/halo.svg',
  'dist/images/showroom/eds-g01/sidepods.svg',
  'dist/images/showroom/eds-g01/tires.svg',
  'dist/images/showroom/eds-g01/floor.svg',
  ...originalTeamStudies.map((id) => `dist/images/eds/vehicle-studies/${id}.svg`),
  ...originalDriverProfiles.map((id) => `dist/images/eds/driver-profiles/${id}.svg`),
  'dist/images/eds/editorial/eds-g01-hero.svg',
  ...[
    'albert-park',
    'shanghai',
    'suzuka',
    'miami',
    'gilles-villeneuve',
    'monaco',
    'catalunya',
    'red-bull-ring',
    'silverstone',
    'spa',
    'hungaroring',
    'zandvoort',
    'monza',
    'madring',
    'baku',
    'sepang',
    'marina-bay',
    'cota',
    'hermanos-rodriguez',
    'interlagos',
    'las-vegas',
    'lusail',
    'yas-marina',
    'bahrain',
  ].map((id) => `dist/images/eds/circuits/${id}.svg`),
];

for (const relativeTarget of [...legacyTargets, ...reviewOnlyTargets]) {
  const target = path.resolve(relativeTarget);
  const distRoot = `${path.resolve('dist')}${path.sep}`;
  if (!target.startsWith(distRoot)) throw new Error(`Refusing to prune outside dist: ${target}`);
  await fs.rm(target, { recursive: true, force: true });
}

const remaining = [];
for (const relativeTarget of [...legacyTargets, ...reviewOnlyTargets]) {
  try {
    await fs.access(path.resolve(relativeTarget));
    remaining.push(relativeTarget);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (remaining.length > 0)
  throw new Error(`Legacy commercial-release assets remain in dist: ${remaining.join(', ')}`);

for (const requiredAsset of requiredOriginalAssets) await fs.access(path.resolve(requiredAsset));
console.log(
  `Commercial artifact guard: removed ${legacyTargets.length} legacy and ${reviewOnlyTargets.length} review-only visual targets; verified ${requiredOriginalAssets.length} original EDS assets.`,
);
