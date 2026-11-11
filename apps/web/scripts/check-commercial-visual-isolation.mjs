import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { clientAssetsDir, requireHtmlShell } from './build-paths.mjs';

const approvedHeroMedia = [
  {
    path: 'media/homepage/hero-h3-2.mp4',
    bytes: 1761848,
    sha256: 'FC9DE024524B299003AEE507798F4A89BDAF635C87EF0EF3770DD29AB94BD421',
  },
  {
    path: 'media/homepage/hero-h3-2-poster.png',
    bytes: 866844,
    sha256: '98F88281993C94425BBC6D6E3FF7EF7E621650A05213EC48937BAD60B691CC69',
  },
];

// Owner-approved Showroom opening film, released to production on 10/11/2026.
const approvedShowroomIntroMedia = [
  {
    path: 'media/showroom/intro-poster.webp',
    bytes: 67618,
    sha256: 'CD97E18974F63490899AB2136D3E83CCEA20797FAE9FDBA1A61DF36106B7CD68',
  },
  {
    path: 'media/showroom/intro-tunnel-720.webm',
    bytes: 1546796,
    sha256: '9A8632759A621A9929ADD94D77ADCE0135E57476E371025504F93DAA275942E6',
  },
  {
    path: 'media/showroom/intro-tunnel-540.mp4',
    bytes: 1025040,
    sha256: '54F5F601471AA2749C98D6AF5CEA9B14ADF44728A99C4CA09C70854532F7B98C',
  },
];

const approvedVideoPaths = new Set(
  [...approvedHeroMedia, ...approvedShowroomIntroMedia]
    .map((asset) => asset.path)
    .filter((assetPath) => assetPath.endsWith('.mp4')),
);

const projectRoot = process.cwd();
const showroomRoot = path.join(projectRoot, 'src/components/showroom');
const sourceEntry = path.join(showroomRoot, 'ShowroomView.tsx');
const bannedSourceModules = [
  '/F1CarTextures.ts',
  '/HotspotDetailsModal.tsx',
  '/LiverySelector.tsx',
  '/SchematicComparisonModal.tsx',
  '/StudioBackdropTexture.ts',
  '/StudioW15Stage.tsx',
  '/teamCloseups.ts',
  '/teamHistoryStats.ts',
  '/teamLiveries.ts',
  '/teamLogoSVGs.ts',
  '/teamSponsors.ts',
];
const forbiddenArtifactTokens = [
  '/models/c42.v2.glb',
  '/models/eds-g02.glb',
  '/models/eds-g03-preview.glb',
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
  const base = path.resolve(path.dirname(importer), specifier);
  for (const candidate of [base, ...extensions.map((extension) => `${base}${extension}`)]) {
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
  throw new Error(`Unable to resolve ${specifier} from ${path.relative(projectRoot, importer)}`);
}

async function walkSourceGraph(filePath) {
  if (visited.has(filePath)) return;
  visited.add(filePath);
  const source = await fs.readFile(filePath, 'utf8');
  const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    if (!match[1].startsWith('.')) continue;
    const resolved = await resolveRelativeImport(filePath, match[1]);
    await walkSourceGraph(resolved);
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
      if (/\.(?:html|js|css|json|svg)$/i.test(entry.name)) artifactFiles.push(filePath);
    }
  }
}
await requireHtmlShell(path.join(clientAssetsDir, 'index.html'));
await walkArtifacts(clientAssetsDir);

const artifactViolations = [];
for (const filePath of artifactPaths) {
  const relativePath = path.relative(projectRoot, filePath).replaceAll('\\', '/');
  for (const forbiddenName of ['tokyo-drift-final.mp4', 'tokyo-drift-final-poster.png', 'tokyo-drift-h2-9-final.mp4', 'tokyo-drift-h2-9-poster.png', 'tokyo-drift-h3-0-final.mp4', 'tokyo-drift-h3-0-poster.png', 'tokyo-drift-h3-1-2x.mp4', 'tokyo-drift-h3-1-2x-poster.png', 'tokyo-drift-h3-1-3x.mp4', 'tokyo-drift-h3-1-3x-poster.png', 'tokyo-drift-h3-2-2x.mp4', 'tokyo-drift-h3-2-3x.mp4', 'tokyo-drift-h3-2-poster.png', 'tokyo-drift-h3-2-3x-poster.png', 'tokyo-drift-h3-2r-homepage.mp4', 'tokyo-drift-h3-2r-homepage-poster.png']) {
    if (relativePath.endsWith(forbiddenName)) artifactViolations.push(`${relativePath} -> forbidden filename`);
  }
}
for (const filePath of artifactFiles) {
  const contents = await fs.readFile(filePath, 'utf8');
  for (const token of forbiddenArtifactTokens) {
    if (contents.includes(token)) {
      artifactViolations.push(`${path.relative(projectRoot, filePath)} -> ${token}`);
    }
  }
}

const heroMediaViolations = [];
const modelBAsset = {
  path: 'models/model-b-eds-optimized-v1.glb',
  bytes: 2120816,
  sha256: '2D0091661DACE5D6C61AEBF898B4974644B44E43A5E8D10F602685C1631610A2',
};
const modelBPath = path.join(clientAssetsDir, modelBAsset.path);
try {
  const bytes = await fs.readFile(modelBPath);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
  if (bytes.length !== modelBAsset.bytes || sha256 !== modelBAsset.sha256) {
    artifactViolations.push(`${modelBAsset.path} -> Model B identity mismatch`);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  artifactViolations.push(`${modelBAsset.path} -> missing from production build`);
}
for (const asset of [...approvedHeroMedia, ...approvedShowroomIntroMedia]) {
  const filePath = path.join(clientAssetsDir, asset.path);
  try {
    const bytes = await fs.readFile(filePath);
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
    if (bytes.length !== asset.bytes) {
      heroMediaViolations.push(`${asset.path} -> ${bytes.length} B (expected ${asset.bytes} B)`);
    }
    if (sha256 !== asset.sha256) {
      heroMediaViolations.push(`${asset.path} -> SHA-256 ${sha256} (expected ${asset.sha256})`);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    heroMediaViolations.push(`${asset.path} -> missing from production build`);
  }
}
const videoArtifacts = artifactPaths
  .filter((filePath) => filePath.endsWith('.mp4'))
  .map((filePath) => path.relative(clientAssetsDir, filePath).replaceAll('\\', '/'));
const unexpectedVideos = videoArtifacts.filter(
  (artifactPath) => !approvedVideoPaths.has(artifactPath),
);
if (unexpectedVideos.length) {
  heroMediaViolations.push(`Unexpected production video artifacts: ${unexpectedVideos.join(', ')}`);
}
if (!videoArtifacts.includes(approvedHeroMedia[0].path)) {
  heroMediaViolations.push(`Missing approved Homepage film: ${approvedHeroMedia[0].path}`);
}

if (sourceViolations.length || artifactViolations.length || heroMediaViolations.length) {
  throw new Error(
    [
      sourceViolations.length
        ? `Legacy modules reachable from production Showroom:\n${sourceViolations.join('\n')}`
        : '',
      artifactViolations.length
        ? `Forbidden commercial artifact tokens:\n${artifactViolations.join('\n')}`
        : '',
      heroMediaViolations.length
        ? `Approved production media verification:\n${heroMediaViolations.join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

console.log(
  `Commercial visual isolation: PASS (${sourceGraph.length} Showroom source modules, ${artifactFiles.length} artifact files scanned).`,
);
