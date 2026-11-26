import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { clientAssetsDir, requireHtmlShell } from './build-paths.mjs';

const projectRoot = process.cwd();
const sourceEntry = path.join(
  projectRoot,
  'src/components/storm/routes/StormShowroomRoute.tsx',
);
const bannedSourceModules = [
  '/F1CarTextures.ts',
  '/HotspotDetailsModal.tsx',
  '/LiverySelector.tsx',
  '/SchematicComparisonModal.tsx',
  '/StudioBackdropTexture.ts',
  '/StudioW15Stage.tsx',
  '/ModelBShowroom.tsx',
  '/modelBLoader.ts',
  '/teamCloseups.ts',
  '/teamHistoryStats.ts',
  '/teamLiveries.ts',
  '/teamLogoSVGs.ts',
  '/teamSponsors.ts',
];
const forbiddenArtifactTokens = [
  '/models/model-b-eds-optimized-v1.glb',
  '/models/c42.v2.glb',
  '/models/eds-g02.glb',
  '/models/eds-g03-preview.glb',
  '/__peds-prototype-assets',
  '/__peds-review/model-b.glb',
  '/__peds-review/tokyo-drift-final.mp4',
  '/__peds-review/tokyo-drift-final-poster.png',
  '/__peds-review/tokyo-drift-h2-9-final.mp4',
  '/__peds-review/tokyo-drift-h2-9-poster.png',
  '/__peds-review/tokyo-drift-h3-0-final.mp4',
  '/__peds-review/tokyo-drift-h3-0-poster.png',
  '/__peds-review/tokyo-drift-h3-1-2x.mp4',
  '/__peds-review/tokyo-drift-h3-1-2x-poster.png',
  '/__peds-review/tokyo-drift-h3-1-3x.mp4',
  '/__peds-review/tokyo-drift-h3-1-3x-poster.png',
  '/__peds-review/tokyo-drift-h3-2-2x.mp4',
  '/__peds-review/tokyo-drift-h3-2-3x.mp4',
  '/__peds-review/tokyo-drift-h3-2-poster.png',
  '/__peds-review/tokyo-drift-h3-2-3x-poster.png',
  '/__peds-review/tokyo-drift-h3-2r-homepage.mp4',
  '/__peds-review/tokyo-drift-h3-2r-homepage-poster.png',
  'hero-h3-2.mp4',
  'hero-h3-2-poster.png',
  'intro-tunnel-720.webm',
  'intro-tunnel-540.mp4',
  'tokyo-drift-final.mp4',
  'tokyo-drift-final-poster.png',
  'tokyo-drift-h2-9-final.mp4',
  'tokyo-drift-h2-9-poster.png',
  'tokyo-drift-h3-0-final.mp4',
  'tokyo-drift-h3-0-poster.png',
  'tokyo-drift-h3-1-2x.mp4',
  'tokyo-drift-h3-1-2x-poster.png',
  'tokyo-drift-h3-1-3x.mp4',
  'tokyo-drift-h3-1-3x-poster.png',
  'tokyo-drift-h3-2-2x.mp4',
  'tokyo-drift-h3-2-3x.mp4',
  'tokyo-drift-h3-2-poster.png',
  'tokyo-drift-h3-2-3x-poster.png',
  'tokyo-drift-h3-2r-homepage.mp4',
  'tokyo-drift-h3-2r-homepage-poster.png',
  '/textures/wheel_base.webp',
  'server.arcgisonline.com',
  'tile.openstreetmap.org',
  'images.unsplash.com',
  'albert_park_pit_straight.webp',
  'albert_park_turn_1.webp',
  'albert_park_lakeside.webp',
  'podium-diffuser-hero-v2.webp',
];

const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const visited = new Set();

async function resolveRelativeImport(importer, specifier) {
  if (/\.(?:webp|png|svg|css|json)$/i.test(specifier)) {
    return null;
  }
  const base = path.resolve(path.dirname(importer), specifier);
  for (const candidate of [
    base,
    ...extensions.map((extension) => `${base}${extension}`),
  ]) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) return candidate;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const extension of extensions) {
    const candidate = path.join(base, `index${extension}`);
    try {
      await fs.access(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(
    `Unable to resolve ${specifier} from ${path.relative(projectRoot, importer)}`,
  );
}

async function walkSourceGraph(filePath) {
  if (visited.has(filePath)) return;
  visited.add(filePath);
  const source = await fs.readFile(filePath, 'utf8');
  const importPattern =
    /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of source.matchAll(importPattern)) {
    const spec = match[1] || match[2];
    if (!spec || !spec.startsWith('.')) continue;
    const resolved = await resolveRelativeImport(filePath, spec);
    if (resolved) await walkSourceGraph(resolved);
  }
}

await walkSourceGraph(sourceEntry);
const sourceGraph = [...visited].map((file) =>
  path.relative(projectRoot, file).replaceAll('\\', '/'),
);
const sourceViolations = sourceGraph.filter((file) =>
  bannedSourceModules.some((moduleName) => file.endsWith(moduleName)),
);

const artifactFiles = [];
const artifactPaths = [];
async function walkArtifacts(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walkArtifacts(filePath);
    else {
      artifactPaths.push(filePath);
      if (/\.(?:html|js|css|json|svg)$/i.test(entry.name))
        artifactFiles.push(filePath);
    }
  }
}
await requireHtmlShell(path.join(clientAssetsDir, 'index.html'));
await walkArtifacts(clientAssetsDir);

const artifactViolations = [];
for (const filePath of artifactFiles) {
  const contents = await fs.readFile(filePath, 'utf8');
  for (const token of forbiddenArtifactTokens) {
    if (contents.includes(token)) {
      artifactViolations.push(
        `${path.relative(projectRoot, filePath)} -> ${token}`,
      );
    }
  }
}

const approvedProductionModels = [
  {
    path: 'models/fp04rb-engineering-v1.glb',
    bytes: 9966120,
    sha256: '16CD7B971B4C86C41CBBA3CE192F015AAAB3335CE24A68F1E58E891B1A4D5526',
    label: 'FP-04 RB Engineering',
  },
  {
    path: 'models/fp04rb-showroom-desktop.glb',
    bytes: 5534176,
    sha256: '29588DA97E49FBECEBB3EA3969149DD8BB00403DA84BCB8FAEAE3F85498D456B',
    label: 'FP-04 RB Showroom Desktop',
  },
  {
    path: 'models/fp04rb-showroom-mobile.glb',
    bytes: 3330168,
    sha256: 'DF8B7FAACDDB20F16FE1534D1ABD1D0C0A896C7725B1442F184BEB8C174C3DEB',
    label: 'FP-04 RB Showroom Mobile',
  },
  {
    path: 'models/fp04rb-pit-crew-v1.glb',
    bytes: 899380,
    sha256: '72D12470F37C24584286FAB3CB31EA28E81EF3FADE510218217DC9BAECC7CFAF',
    label: 'FP-04 RB Pit Crew Rigged',
  },
];

for (const modelAsset of approvedProductionModels) {
  const modelPath = path.join(clientAssetsDir, modelAsset.path);
  try {
    const bytes = await fs.readFile(modelPath);
    const sha256 = crypto
      .createHash('sha256')
      .update(bytes)
      .digest('hex')
      .toUpperCase();
    if (bytes.length !== modelAsset.bytes || sha256 !== modelAsset.sha256) {
      artifactViolations.push(
        `${modelAsset.path} -> ${modelAsset.label} identity mismatch`,
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    artifactViolations.push(
      `${modelAsset.path} -> missing from production build`,
    );
  }
}

const mediaViolations = [];
const videoArtifacts = artifactPaths
  .filter((filePath) => /\.(?:mp4|webm)$/i.test(filePath))
  .map((filePath) =>
    path.relative(clientAssetsDir, filePath).replaceAll('\\', '/'),
  );
if (videoArtifacts.length > 0) {
  mediaViolations.push(
    `Retired video artifacts must not ship in client build: ${videoArtifacts.join(', ')}`,
  );
}

if (
  sourceViolations.length ||
  artifactViolations.length ||
  mediaViolations.length
) {
  throw new Error(
    [
      sourceViolations.length
        ? `Legacy modules reachable from production Showroom:\n${sourceViolations.join('\n')}`
        : '',
      artifactViolations.length
        ? `Forbidden commercial artifact tokens:\n${artifactViolations.join('\n')}`
        : '',
      mediaViolations.length
        ? `Production media verification:\n${mediaViolations.join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

console.log(
  `Commercial visual isolation: PASS (${sourceGraph.length} Showroom source modules, ${artifactFiles.length} artifact files scanned, 0 video artifacts).`,
);
