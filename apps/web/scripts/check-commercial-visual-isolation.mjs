import fs from 'node:fs/promises';
import path from 'node:path';

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
  'model-b-eds-optimized-v1.glb',
  'commercial-b',
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
async function walkArtifacts(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walkArtifacts(filePath);
    else if (/\.(?:html|js|css|json|svg)$/i.test(entry.name)) artifactFiles.push(filePath);
  }
}
await walkArtifacts(path.join(projectRoot, 'dist'));

const artifactViolations = [];
for (const filePath of artifactFiles) {
  const contents = await fs.readFile(filePath, 'utf8');
  for (const token of forbiddenArtifactTokens) {
    if (contents.includes(token)) {
      artifactViolations.push(`${path.relative(projectRoot, filePath)} -> ${token}`);
    }
  }
}

if (sourceViolations.length || artifactViolations.length) {
  throw new Error(
    [
      sourceViolations.length
        ? `Legacy modules reachable from production Showroom:\n${sourceViolations.join('\n')}`
        : '',
      artifactViolations.length
        ? `Forbidden commercial artifact tokens:\n${artifactViolations.join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

console.log(
  `Commercial visual isolation: PASS (${sourceGraph.length} Showroom source modules, ${artifactFiles.length} artifact files scanned).`,
);
