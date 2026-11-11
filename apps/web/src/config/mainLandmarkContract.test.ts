import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [full] : [];
  });

const productionFiles = walk('src').filter(
  (file) => !/\.(test|spec)\.tsx$/.test(file) && !file.startsWith('src\\dev'),
);

describe('main landmark contract', () => {
  it('keeps exactly one main landmark in the application shell', () => {
    const shell = readFileSync('src/App.tsx', 'utf8');
    expect(shell.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(shell).toContain('tabIndex={-1}');
  });

  it('does not nest a second main inside routed page components', () => {
    const offenders = productionFiles
      .filter((file) => !file.endsWith('App.tsx'))
      .filter((file) => /<main\b/.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });
});
