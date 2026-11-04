import { useEffect } from 'react';

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
      const size = probe.getBoundingClientRect().width;
      const ratio = size > 0 ? size / 16 : 1;
      root.dataset.textZoom = ratio >= 3 ? '400' : ratio >= 1.5 ? '200' : 'normal';
    };
    const observer = new ResizeObserver(update);
    observer.observe(probe);
    update();
    return () => {
      observer.disconnect();
      probe.remove();
      delete root.dataset.textZoom;
    };
  }, []);
}
