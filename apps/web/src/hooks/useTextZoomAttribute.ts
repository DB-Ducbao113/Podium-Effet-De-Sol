import { useEffect } from 'react';

export type TextZoomLevel = 'normal' | '200' | '400';

/** Live VISUAL-ZOOM-01 scale: 0.75 on wide desktop, 1 wherever the scale is off. */
export function visualZoomFactor(root: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(root).getPropertyValue('--peds-visual-zoom')) || 1;
}

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
  return textZoomLevel(probe.getBoundingClientRect().width, visualZoomFactor(root));
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
    let lastLevel: TextZoomLevel | null = null;
    const update = () => {
      const next = resolveTextZoomLevel(root, probe);
      if (next !== lastLevel) {
        lastLevel = next;
        root.dataset.textZoom = next;
      }
    };
    const observer = new ResizeObserver(update);
    observer.observe(probe);
    window.addEventListener('resize', update, { passive: true });
    // Defer initial read to next animation frame so appendChild(probe) never forces synchronous layout.
    const rafId = window.requestAnimationFrame(update);
    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', update);
      probe.remove();
      delete root.dataset.textZoom;
    };
  }, []);
}
