import { visualZoomFactor } from '../hooks/useTextZoomAttribute';

/** Single source for the compact band that Home choreography and the hero both read. */
export const COMPACT_BREAKPOINT = '(max-width: 860px)';

export type ViewportMetrics = {
  /** CSS px of the viewport; getBoundingClientRect and scroll offsets share this space. */
  width: number;
  height: number;
  /** 0.75 on wide desktop under VISUAL-ZOOM-01, 1 elsewhere. */
  zoom: number;
  compact: boolean;
};

const SERVER: ViewportMetrics = { width: 0, height: 0, zoom: 1, compact: true };

export function readViewportMetrics(): ViewportMetrics {
  if (typeof window === 'undefined' || typeof document === 'undefined') return SERVER;
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    zoom: visualZoomFactor(document.documentElement),
    compact: window.matchMedia(COMPACT_BREAKPOINT).matches,
  };
}

/** Layout px (offsetHeight, a CSS length) converted into the rect/scrollY space. */
export function toVisualPx(layoutPx: number, zoom: number): number {
  return layoutPx * zoom;
}

/** The reverse, for handing a measured rect back to CSS that is written in layout px. */
export function toLayoutPx(visualPx: number, zoom: number): number {
  return visualPx / zoom;
}
