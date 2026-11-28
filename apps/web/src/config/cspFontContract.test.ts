import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const headers = readFileSync('public/_headers', 'utf8');
const viteConfig = readFileSync('vite.config.ts', 'utf8');
const globalCss = readFileSync('src/index.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');

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

  it('matches display fallback metrics to the shipped display face so a late swap cannot reflow', () => {
    expect(globalCss).toMatch(
      /@font-face\s*\{\s*font-family:\s*'PEDS Display Fallback';\s*src:\s*local\('Arial'\), local\('Helvetica'\), local\('Liberation Sans'\);\s*size-adjust:\s*100%;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-script:\s*'Corinthia',\s*'Dancing Script Variable', cursive;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-hand:\s*'Dancing Script Variable',\s*'Corinthia', cursive;/,
    );
    // Unified Motorsport Tech + Luxury Editorial faces (100% Vietnamese covered).
    expect(globalCss).toMatch(
      /--peds-font-editorial:\s*'Cormorant Garamond Variable', 'Palatino Linotype', 'Times New Roman', serif;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-display:\s*'Chakra Petch',\s*'PEDS Display Fallback', Arial, sans-serif;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-ui:\s*'Be Vietnam Pro',\s*'PEDS Display Fallback', Arial, sans-serif;/,
    );
    expect(globalCss).toMatch(
      /--peds-font-body:\s*'Be Vietnam Pro', Arial, sans-serif;/,
    );
    // VI scope stays aligned with full-Vietnamese-covered faces (zero Windows Georgia fallback).
    expect(globalCss).toMatch(
      /html\[lang='vi'\]\s*\{[^}]*--peds-font-editorial:\s*'Cormorant Garamond Variable', 'Palatino Linotype', 'Times New Roman', serif;[^}]*--peds-font-display:\s*'Chakra Petch', 'PEDS Display Fallback', Arial, sans-serif;[^}]*--peds-font-body:\s*'Be Vietnam Pro', Arial, sans-serif;/s,
    );
    // The global sheet itself declares no italic; italic accents live in component
    // styles and are delivered as real self-hosted cuts, never synthesised.
    expect(globalCss).not.toMatch(/font-style\s*:\s*italic/);
    expect(main).toContain('@fontsource/chakra-petch/700.css');
    expect(main).toContain('@fontsource/be-vietnam-pro/400.css');
    expect(main).toContain('@fontsource-variable/cormorant-garamond/wght-italic.css');
    expect(globalCss).not.toMatch(/\b(?:Barlow Condensed|Space Grotesk|Plus Jakarta Sans|Quicksand|Lexend|Lora)\b/i);
  });
});