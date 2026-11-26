import type Lenis from "lenis";
import { useEffect, useRef } from "react";
import { ensureStormGsapPlugins, gsap, ScrollTrigger } from "./gsapPlugins";
import { isEligibleForLenis } from "./motionConfig";

export interface UseLenisSmoothScrollOptions {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly pathname: string;
}

/**
 * FX-08a — Desktop Lenis smooth scroll synchronized with GSAP ScrollTrigger & gsap.ticker.
 * Dynamically imports Lenis only on eligible desktop fine-pointer non-3D routes so
 * mobile/touch devices never download or parse unused smooth-scroll code.
 */
export function useLenisSmoothScroll({
  enabled,
  reducedMotion,
  pathname,
}: UseLenisSmoothScrollOptions): { readonly isActive: boolean } {
  const lenisRef = useRef<Lenis | null>(null);
  const eligible = isEligibleForLenis({ enabled, reducedMotion, pathname });

  useEffect(() => {
    if (!eligible || typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | null = null;

    void import("lenis").then(({ default: LenisCtor }) => {
      if (cancelled) return;
      ensureStormGsapPlugins();

      const lenis = new LenisCtor({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.95,
      });
      lenisRef.current = lenis;

      const onScroll = () => {
        ScrollTrigger.update();
      };
      lenis.on("scroll", onScroll);

      const onTick = (timeSeconds: number) => {
        if (typeof document !== "undefined" && document.hidden) return;
        lenis.raf(timeSeconds * 1000);
      };
      gsap.ticker.add(onTick);
      gsap.ticker.lagSmoothing(0);

      const onVisibilityChange = () => {
        if (document.hidden) {
          lenis.stop();
        } else {
          lenis.start();
        }
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      cleanup = () => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        gsap.ticker.remove(onTick);
        lenis.off("scroll", onScroll);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [eligible]);

  return { isActive: eligible };
}
