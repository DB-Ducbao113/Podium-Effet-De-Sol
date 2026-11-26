import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function expoOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped >= 1 ? 1 : 1 - Math.pow(2, -10 * clamped);
}

export function computeStaggerDelayMs(
  index: number,
  stepMs = 32,
  maxMs = 260,
): number {
  if (index <= 0) return 0;
  return Math.min(Math.round(index * stepMs), maxMs);
}

export function useKineticNumber(
  target: number,
  reducedMotion: boolean,
  durationMs = 540,
): number {
  const [display, setDisplay] = useState<number>(target);
  const currentRef = useRef<number>(target);

  useEffect(() => {
    if (
      reducedMotion ||
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    const from = currentRef.current;
    if (from === target) {
      setDisplay(target);
      return;
    }

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / Math.max(1, durationMs));
      const eased = expoOut(progress);
      const next = Math.round(from + (target - from) * eased);
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
        setDisplay(target);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [durationMs, reducedMotion, target]);

  return reducedMotion ? target : display;
}

export interface SlidingPillGeometry {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly ready: boolean;
}

const EMPTY_PILL: SlidingPillGeometry = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  ready: false,
};

export function useSlidingGlassPill(
  containerRef: RefObject<HTMLElement | null>,
  activeKey: string | number,
  selector = ".is-active",
): SlidingPillGeometry {
  const [geo, setGeo] = useState<SlidingPillGeometry>(EMPTY_PILL);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(selector);
      if (!active) {
        setGeo(EMPTY_PILL);
        return;
      }
      const next: SlidingPillGeometry = {
        left: active.offsetLeft,
        top: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
        ready: active.offsetWidth > 0 && active.offsetHeight > 0,
      };
      setGeo((prev) =>
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.ready === next.ready
          ? prev
          : next,
      );
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(container);
    }

    return () => {
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [activeKey, containerRef, selector]);

  return geo;
}

export interface GlowElementLike {
  getBoundingClientRect(): {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  readonly style: {
    setProperty(name: string, value: string): void;
  };
}

export function createCachedGlowController() {
  let activeTarget: GlowElementLike | null = null;
  let cachedRect: ReturnType<GlowElementLike["getBoundingClientRect"]> | null =
    null;
  let lastClientX = 0;
  let lastClientY = 0;

  return {
    onTargetMove(
      target: GlowElementLike | null,
      clientX: number,
      clientY: number,
    ): boolean {
      if (activeTarget !== target) {
        if (activeTarget) {
          activeTarget.removeAttribute("data-lg-lit");
        }
        activeTarget = target;
        cachedRect = activeTarget ? activeTarget.getBoundingClientRect() : null;
        if (activeTarget) {
          activeTarget.setAttribute("data-lg-lit", "true");
        }
      }
      if (!activeTarget) return false;
      lastClientX = clientX;
      lastClientY = clientY;
      return true;
    },
    flushFrame(): void {
      if (!activeTarget) return;
      if (!cachedRect) {
        cachedRect = activeTarget.getBoundingClientRect();
      }
      if (cachedRect.width <= 0 || cachedRect.height <= 0) return;
      const mx = Math.min(
        100,
        Math.max(0, ((lastClientX - cachedRect.left) / cachedRect.width) * 100),
      );
      const my = Math.min(
        100,
        Math.max(0, ((lastClientY - cachedRect.top) / cachedRect.height) * 100),
      );
      activeTarget.style.setProperty("--lg-mx", `${mx.toFixed(1)}%`);
      activeTarget.style.setProperty("--lg-my", `${my.toFixed(1)}%`);
    },
    invalidate(): void {
      cachedRect = null;
    },
    clear(): void {
      if (activeTarget) {
        activeTarget.removeAttribute("data-lg-lit");
        activeTarget = null;
        cachedRect = null;
      }
    },
  };
}

/**
 * Delegated rAF-throttled pointer-light refraction driver with cached target bounds (`REQ-13`).
 * Measures `getBoundingClientRect()` ONLY once when entering a new `[data-lg-glow]` element
 * (or after scroll/resize invalidation) — zero forced layout reads per pointer frame.
 */
export function useLiquidPointerGlow(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
): void {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || reducedMotion || typeof window === "undefined") return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    let rafId = 0;
    const controller = createCachedGlowController();

    const flush = () => {
      rafId = 0;
      controller.flushFrame();
    };

    const onPointerMove = (event: PointerEvent) => {
      const target =
        (event.target as HTMLElement | null)?.closest<HTMLElement>(
          "[data-lg-glow]",
        ) ?? null;
      if (!controller.onTargetMove(target, event.clientX, event.clientY)) {
        return;
      }
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    const clearLit = () => {
      controller.clear();
    };
    const invalidateRect = () => {
      controller.invalidate();
    };

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", clearLit, { passive: true });
    window.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect, { passive: true });

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", clearLit);
      window.removeEventListener("scroll", invalidateRect);
      window.removeEventListener("resize", invalidateRect);
      if (rafId) window.cancelAnimationFrame(rafId);
      clearLit();
    };
  }, [containerRef, reducedMotion]);
}

export function useViewportReveal(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
  resetKey: string | number,
): void {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof window === "undefined") return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-lg-reveal]"),
    );
    if (nodes.length === 0) return;

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      for (const node of nodes) {
        node.setAttribute("data-lg-visible", "true");
      }
      return;
    }

    const viewportH = window.innerHeight || 900;
    const pendingNodes: HTMLElement[] = [];

    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.top < viewportH * 0.96) {
        node.setAttribute("data-lg-visible", "true");
      } else {
        node.setAttribute("data-lg-visible", "pending");
        pendingNodes.push(node);
      }
    }

    if (pendingNodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty(
            "--lg-reveal-delay",
            `${Math.min(batchIdx * 36, 180)}ms`,
          );
          el.setAttribute("data-lg-visible", "true");
          observer.unobserve(el);
          batchIdx += 1;
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );

    for (const node of pendingNodes) {
      observer.observe(node);
    }

    return () => observer.disconnect();
  }, [containerRef, reducedMotion, resetKey]);
}
