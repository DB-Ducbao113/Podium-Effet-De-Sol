import { useEffect, useRef } from "react";
import { ROUTE_VEIL_MAX_DURATION_MS } from "./motionConfig";

export interface RouteTransitionVeilProps {
  readonly triggerKey: string | number;
  readonly reducedMotion: boolean;
}

/**
 * FX-08b — Fast, non-blocking Storm accent/glass sweep veil (`<= 190ms`).
 * Skips initial mount (and never loads GSAP on first paint), triggers zero React
 * state re-renders, never traps pointer/keyboard input, and returns null on `reducedMotion`.
 */
export function RouteTransitionVeil({
  triggerKey,
  reducedMotion,
}: RouteTransitionVeilProps) {
  const veilRef = useRef<HTMLDivElement | null>(null);
  const lastKeyRef = useRef<string | number>(triggerKey);

  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") {
      lastKeyRef.current = triggerKey;
      return;
    }
    if (lastKeyRef.current === triggerKey) {
      return;
    }
    lastKeyRef.current = triggerKey;

    const el = veilRef.current;
    if (!el) return;

    let cancelled = false;
    void import("./gsapPlugins").then(({ ensureStormGsapPlugins, gsap }) => {
      if (cancelled || !veilRef.current) return;
      ensureStormGsapPlugins();
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { xPercent: -100, opacity: 0.92 },
        {
          xPercent: 100,
          opacity: 0,
          duration: ROUTE_VEIL_MAX_DURATION_MS / 1000,
          ease: "power2.out",
        },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [triggerKey, reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      ref={veilRef}
      className="sm-route-veil"
      data-fx="FX-08b"
      data-testid="storm-route-veil"
      aria-hidden="true"
    />
  );
}
