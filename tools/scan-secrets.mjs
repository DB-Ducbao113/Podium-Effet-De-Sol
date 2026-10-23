import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', 'coverage', '.local-assets', 'scratch']);
const patterns = [
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['generic bearer token', /authorization\s*[:=]\s*["']?bearer\s+[A-Za-z0-9._-]{20,}/gi],
];
const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && fs.statSync(absolute).size <= 2_000_000) scan(absolute);
  }
}

function scan(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const [name, pattern] of patterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) findings.push(`${path.relative(root, file)}: ${name}`);
  }
}

walk(root);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exit(1);
}
console.log('Secret scan: PASS');
