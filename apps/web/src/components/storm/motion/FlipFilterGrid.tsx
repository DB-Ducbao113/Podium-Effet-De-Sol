import { Flip } from "gsap/Flip";
import {
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { ensureStormGsapPlugins, gsap } from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  type StormMotionIntensity,
} from "./motionConfig";

export interface FlipFilterGridProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly layoutKey: string;
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly flipStateRef: MutableRefObject<Flip.FlipState | null>;
  readonly containerRef: MutableRefObject<HTMLDivElement | null>;
}

/**
 * FX-07 — Smooth GSAP 3.15 Flip layout container for filterable/sortable F1 cards & tables.
 */
export function FlipFilterGrid({
  children,
  className = "",
  layoutKey,
  reducedMotion,
  intensity = "luxury",
  flipStateRef,
  containerRef,
}: FlipFilterGridProps) {
  const preset = STORM_MOTION_PRESETS[intensity];
  const lastKeyRef = useRef<string>(layoutKey);

  useLayoutEffect(() => {
    if (lastKeyRef.current === layoutKey) return;
    lastKeyRef.current = layoutKey;

    const state = flipStateRef.current;
    flipStateRef.current = null;
    if (!state || reducedMotion || typeof window === "undefined") {
      return;
    }

    ensureStormGsapPlugins();
    gsap.registerPlugin(Flip);
    Flip.from(state, {
      duration: 0.54 * preset.durationScale,
      ease: "power3.inOut",
      stagger: 0.024 * preset.staggerScale,
      scale: true,
      nested: true,
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.94, y: 12 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.36 * preset.durationScale,
            ease: "expo.out",
          },
        ),
      onLeave: (elements) =>
        gsap.to(elements, {
          opacity: 0,
          scale: 0.94,
          duration: 0.22 * preset.durationScale,
          ease: "power2.in",
        }),
    });
  }, [
    flipStateRef,
    intensity,
    layoutKey,
    preset.durationScale,
    preset.staggerScale,
    reducedMotion,
  ]);

  return (
    <div ref={containerRef} className={className} data-fx="FX-07">
      {children}
    </div>
  );
}
