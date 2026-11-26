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
  (file) => !/\.(test|spec)\.tsx$/.test(file),
);

describe('main landmark contract', () => {
  it('keeps exactly one main landmark in StormAppShell', () => {
    const shell = readFileSync('src/components/storm/StormAppShell.tsx', 'utf8');
    expect(shell.match(/<main\b/g) ?? []).toHaveLength(1);
    expect(shell).toContain('tabIndex={-1}');
  });

  it('does not nest a second main inside App.tsx or routed page components', () => {
    const offenders = productionFiles
      .filter((file) => !file.replace(/\\/g, '/').endsWith('StormAppShell.tsx'))
      .filter((file) => /<main\b/.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(/\\/g, '/'));
    expect(offenders).toEqual([]);
  });
});
