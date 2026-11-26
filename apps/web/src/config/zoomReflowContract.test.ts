import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const globalCss = read('src/index.css');
const stormCss = read('src/components/storm/stormShell.css');
const zoomHook = read('src/hooks/useTextZoomAttribute.ts');

describe('text-only zoom reflow contract', () => {
  it('mirrors text zoom onto the document root instead of component-local probes', () => {
    expect(zoomHook).toContain('new ResizeObserver');
    expect(zoomHook).toContain("ratio >= 3 ? '400' : ratio >= 1.5 ? '200' : 'normal'");
    expect(zoomHook).toContain('root.dataset.textZoom');
  });

  it('pins page gutters in px and allows vertical reflow on Storm Overview at 400% zoom', () => {
    expect(globalCss).toMatch(/\[data-text-zoom="400"\] \.page-container\s*\{\s*padding-inline:\s*12px;/);
    expect(globalCss).toMatch(/\[data-text-zoom="200"\] \.page-container\s*\{\s*padding-inline:\s*20px;/);
    expect(stormCss).toContain('.sp-storm-overview');
    expect(stormCss).toContain('min-height: calc(100svh / var(--peds-visual-zoom));');
    expect(stormCss).toContain('overflow: visible;');
  });
});
