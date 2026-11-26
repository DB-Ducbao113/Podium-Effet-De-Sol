import { describe, expect, it } from 'vitest';
import { COMPACT_BREAKPOINT, readViewportMetrics, toLayoutPx, toVisualPx } from './viewportMetrics';

describe('viewport metrics', () => {
  it('has no DOM space on the server', () => {
    expect(readViewportMetrics()).toEqual({ width: 0, height: 0, zoom: 1, compact: true });
  });

  it('converts layout px to the rect and scroll space that choreography reads', () => {
    // VISUAL-ZOOM-01 applies 0.75 only from 1180px up, which is where mixing the
    // two spaces is otherwise invisible to a 390px or 1024px pass.
    expect(toVisualPx(100, 0.75)).toBe(75);
    expect(toLayoutPx(75, 0.75)).toBeCloseTo(100);
    expect(toLayoutPx(toVisualPx(1893, 0.75), 0.75)).toBeCloseTo(1893);
    expect(toVisualPx(100, 1)).toBe(100);
    expect(toLayoutPx(100, 1)).toBe(100);
  });

  it('keeps the hero scrub in one pixel space', () => {
    // .home-v5__scrolly is 225svh divided by the zoom, so its layout height grows
    // while its measured rect stays at 225 viewport heights: the two spaces agree.
    const innerHeight = 900;
    for (const zoom of [1, 0.75]) {
      const layoutHeight = (225 * innerHeight) / 100 / zoom;
      expect(toVisualPx(layoutHeight, zoom)).toBeCloseTo(225 * (innerHeight / 100));
    }
    expect(COMPACT_BREAKPOINT).toBe('(max-width: 860px)');
  });
});
