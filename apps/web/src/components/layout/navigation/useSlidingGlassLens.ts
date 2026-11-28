import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { Language } from "../../../types";
import type { CanonicalNavId } from "./navRegistry";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface LensRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface UseSlidingGlassLensOptions {
  readonly railRef: RefObject<HTMLElement | null>;
  readonly lensRef: RefObject<HTMLSpanElement | null>;
  readonly activeId: CanonicalNavId | null;
  readonly lang: Language;
  readonly reducedMotion: boolean;
  readonly visible: boolean;
}

function measureActiveItemRect(
  rail: HTMLElement,
  activeId: CanonicalNavId | null,
): LensRect | null {
  if (!activeId) return null;
  const item = rail.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`);
  if (!item) return null;
  const w = item.offsetWidth;
  const h = item.offsetHeight;
  if (w <= 0 || h <= 0) return null;

  let x = 0;
  let y = 0;
  let current: HTMLElement | null = item;
  while (current && current !== rail) {
    x += current.offsetLeft;
    y += current.offsetTop;
    const nextParent = current.offsetParent as HTMLElement | null;
    if (nextParent && nextParent !== rail) {
      x += nextParent.clientLeft;
      y += nextParent.clientTop;
    }
    current = nextParent;
  }

  return { x, y, w, h };
}

function applyRestingGeometry(lens: HTMLSpanElement, rect: LensRect | null) {
  if (!rect) {
    lens.style.opacity = "0";
    return;
  }
  lens.style.width = `${rect.w}px`;
  lens.style.height = `${rect.h}px`;
  lens.style.transform = `translate3d(${rect.x}px, ${rect.y}px, 0)`;
  lens.style.opacity = "1";
}

/**
 * Layer 1 compositor-only WAAPI FLIP sliding glass lens controller (BR-11, ADR-NAV-04).
 * Uses `fill: 'none'` so resting state sits at un-stretched `scaleX(1)` and cancels cleanly
 * on rapid clicks, resizes, font loads, or unmount.
 */
export function useSlidingGlassLens({
  railRef,
  lensRef,
  activeId,
  lang,
  reducedMotion,
  visible,
}: UseSlidingGlassLensOptions): void {
  const prevRectRef = useRef<LensRect | null>(null);
  const animRef = useRef<Animation | null>(null);
  const hasMountedRef = useRef(false);
  const lastSizeRef = useRef<{ w: number; h: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const rail = railRef.current;
    const lens = lensRef.current;
    if (!rail || !lens || !visible) {
      animRef.current?.cancel();
      animRef.current = null;
      if (!visible) {
        prevRectRef.current = null;
        hasMountedRef.current = false;
        lastSizeRef.current = null;
      }
      return;
    }

    // Capture mid-flight visual geometry so rapid multi-tab clicks smoothly glide from current position.
    let startRect = prevRectRef.current;
    if (
      animRef.current &&
      animRef.current.playState === "running" &&
      typeof window !== "undefined"
    ) {
      const railBox = rail.getBoundingClientRect();
      const lensBox = lens.getBoundingClientRect();
      const zoom =
        Number.parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      if (lensBox.width > 0 && lensBox.height > 0) {
        startRect = {
          x: (lensBox.left - railBox.left) / zoom,
          y: (lensBox.top - railBox.top) / zoom,
          w: lensBox.width / zoom,
          h: lensBox.height / zoom,
        };
      }
    }

    let initRafId = 0;
    const syncInitialOrAnimate = () => {
      const nextRect = measureActiveItemRect(rail, activeId);
      lastSizeRef.current = { w: rail.offsetWidth, h: rail.offsetHeight };

      animRef.current?.cancel();
      animRef.current = null;

      applyRestingGeometry(lens, nextRect);

      if (
        hasMountedRef.current &&
        !reducedMotion &&
        startRect !== null &&
        nextRect !== null &&
        (Math.abs(startRect.x - nextRect.x) > 0.5 ||
          Math.abs(startRect.y - nextRect.y) > 0.5 ||
          Math.abs(startRect.w - nextRect.w) > 0.5) &&
        typeof lens.animate === "function"
      ) {
        const scaleX = startRect.w / nextRect.w;
        const anim = lens.animate(
          [
            {
              transform: `translate3d(${startRect.x}px, ${startRect.y}px, 0) scaleX(${scaleX})`,
            },
            {
              transform: `translate3d(${nextRect.x}px, ${nextRect.y}px, 0) scaleX(1)`,
            },
          ],
          {
            duration: 380,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "none",
          },
        );
        anim.addEventListener("finish", () => {
          if (animRef.current === anim) animRef.current = null;
        });
        animRef.current = anim;
      }

      prevRectRef.current = nextRect;
      hasMountedRef.current = true;
    };

    if (!hasMountedRef.current && typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      initRafId = window.requestAnimationFrame(syncInitialOrAnimate);
    } else {
      syncInitialOrAnimate();
    }

    const snapSilently = () => {
      animRef.current?.cancel();
      animRef.current = null;
      const synced = measureActiveItemRect(rail, activeId);
      applyRestingGeometry(lens, synced);
      prevRectRef.current = synced;
    };

    // Only snap on real rail dimension changes — NEVER cancel an active tab-switch FLIP on initial observe!
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        const prev = lastSizeRef.current;
        const nextW = rail.offsetWidth;
        const nextH = rail.offsetHeight;
        if (
          prev &&
          Math.abs(nextW - prev.w) < 1 &&
          Math.abs(nextH - prev.h) < 1
        ) {
          return;
        }
        lastSizeRef.current = { w: nextW, h: nextH };
        snapSilently();
      });
      observer.observe(rail);
    }

    let mounted = true;
    if (
      typeof document !== "undefined" &&
      document.fonts?.ready &&
      document.fonts.status !== "loaded"
    ) {
      document.fonts.ready.then(() => {
        if (mounted) snapSilently();
      });
    }

    return () => {
      mounted = false;
      if (initRafId && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(initRafId);
      }
      observer?.disconnect();
      animRef.current?.cancel();
      animRef.current = null;
    };
  }, [activeId, lang, lensRef, railRef, reducedMotion, visible]);
}
