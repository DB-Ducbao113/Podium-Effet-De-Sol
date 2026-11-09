import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const headers = readFileSync('public/_headers', 'utf8');
const viteConfig = readFileSync('vite.config.ts', 'utf8');
const globalCss = readFileSync('src/index.css', 'utf8');

describe('CSP font delivery contract', () => {
  it('keeps font-src on same-origin hosts only', () => {
    expect(headers).toMatch(/font-src 'self' https:\/\/fonts\.gstatic\.com;/);
    expect(headers).not.toMatch(/font-src[^;]*data:/);
  });

  it('never inlines font binaries into the stylesheet', () => {
    expect(viteConfig).toMatch(/assetsInlineLimit:\s*\(filePath: string\) =>/);
    expect(viteConfig).toMatch(/\\\.\(\?:woff2\?\|ttf\|otf\|eot\)\$/);
    expect(viteConfig).toMatch(/\? false : undefined/);
  });

  it('matches display fallback metrics to Barlow Condensed so a late swap cannot reflow', () => {
    expect(globalCss).toMatch(
      /@font-face\s*\{\s*font-family:\s*'Barlow Condensed Fallback';\s*src:\s*local\('Arial Narrow'\);\s*size-adjust:\s*80%;/,
    );
    expect(globalCss).toMatch(
      /@font-face\s*\{\s*font-family:\s*'Barlow Condensed Arial Fallback';\s*src:\s*local\('Arial'\), local\('Helvetica'\), local\('Liberation Sans'\);\s*size-adjust:\s*68%;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-display:\s*'Barlow Condensed',\s*'Barlow Condensed Fallback',\s*'Barlow Condensed Arial Fallback',\s*'Arial Narrow',\s*sans-serif;/,
    );
    expect(globalCss).toMatch(
      /@font-face\s*\{\s*font-family:\s*'Barlow Condensed Fallback';\s*src:\s*local\('Arial Narrow'\);\s*size-adjust:\s*83%;\s*font-weight:\s*100 900;\s*font-style:\s*italic;/,
    );
    expect(globalCss).toMatch(
      /@font-face\s*\{\s*font-family:\s*'Barlow Condensed Arial Fallback';\s*src:\s*local\('Arial'\), local\('Helvetica'\), local\('Liberation Sans'\);\s*size-adjust:\s*70\.5%;\s*font-weight:\s*100 900;\s*font-style:\s*italic;/,
    );
  });
});
