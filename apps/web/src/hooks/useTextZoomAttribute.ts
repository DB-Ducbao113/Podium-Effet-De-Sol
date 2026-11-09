import { useEffect } from 'react';

export type TextZoomLevel = 'normal' | '200' | '400';

/** Thresholds are browser text-zoom factors, measured on a rendered 1rem probe. */
export function textZoomLevel(sizePx: number, visualZoom: number): TextZoomLevel {
  const ratio = sizePx > 0 ? sizePx / (16 * visualZoom) : 1;
  return ratio >= 3 ? '400' : ratio >= 1.5 ? '200' : 'normal';
}

/**
 * VISUAL-ZOOM-01 renders a 1rem probe at 0.75 scale without changing rem, so the
 * 200/400% text-zoom thresholds are measured against the scaled base.
 */
export function resolveTextZoomLevel(root: HTMLElement, probe: HTMLElement): TextZoomLevel {
  const visualZoom = Number.parseFloat(getComputedStyle(root).getPropertyValue('--peds-visual-zoom')) || 1;
  return textZoomLevel(probe.getBoundingClientRect().width, visualZoom);
}

/**
 * Mirrors browser text-only zoom onto <html data-text-zoom> so global chrome
 * (header, footer, tab rails) can reflow instead of clipping.
 */
export function useTextZoomAttribute() {
  useEffect(() => {
    const probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;width:1rem;height:1rem;pointer-events:none;visibility:hidden';
    document.body.appendChild(probe);
    const root = document.documentElement;
    const update = () => {
      root.dataset.textZoom = resolveTextZoomLevel(root, probe);
    };
    const observer = new ResizeObserver(update);
    observer.observe(probe);
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      probe.remove();
      delete root.dataset.textZoom;
    };
  }, []);
}
