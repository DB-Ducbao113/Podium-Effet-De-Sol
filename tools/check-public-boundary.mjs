import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const forbiddenDirectories = ['docs/visual-feedback'];
const forbiddenExtensions = new Set(['.blend', '.blend1', '.mp4', '.webm', '.zip', '.7z']);
const allowedGlb = new Set(['apps/web/public/models/eds-g01.glb']);
const violations = [];

function normalize(value) {
  return value.split(path.sep).join('/');
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === '.git' ||
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.local-assets' ||
      entry.name === 'scratch' ||
      entry.name === 'references' ||
      entry.name === 'archives'
    )
      continue;
    const absolute = path.join(directory, entry.name);
    const relative = normalize(path.relative(root, absolute));
    if (entry.isDirectory()) {
      if (forbiddenDirectories.includes(relative)) violations.push(relative);
      else walk(absolute);
    } else {
      const extension = path.extname(entry.name).toLowerCase();
      if (forbiddenExtensions.has(extension)) violations.push(relative);
      if (extension === '.glb' && !allowedGlb.has(relative)) violations.push(relative);
    }
  }
}

walk(root);
if (violations.length) {
  console.error(`Public boundary violations:\n${[...new Set(violations)].join('\n')}`);
  process.exit(1);
}
console.log('Public asset boundary: PASS');
