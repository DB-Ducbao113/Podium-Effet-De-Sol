import { useRef, type ReactNode } from "react";
import {
  ensureStormGsapPlugins,
  gsap,
  SplitText,
  useGSAP,
} from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  type StormMotionIntensity,
} from "./motionConfig";

export interface StormSplitHeadlineProps {
  readonly as?: "h1" | "h2" | "h3" | "p" | "div";
  readonly children: ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly replayKey?: number | string;
  readonly delay?: number;
}

/**
 * FX-01 — Kinetic display headline using GSAP 3.15 SplitText (`lines,words`, `mask: "lines"`,
 * `aria: "auto"`) so Vietnamese diacritics stay intact and screen readers stay clean.
 */
export function StormSplitHeadline({
  as = "h2",
  children,
  className = "",
  id,
  reducedMotion,
  intensity = "luxury",
  replayKey = 0,
  delay = 0.04,
}: StormSplitHeadlineProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const preset = STORM_MOTION_PRESETS[intensity];

  useGSAP(
    () => {
      const el = hostRef.current;
      if (!el || reducedMotion || typeof window === "undefined") {
        if (el) gsap.set(el, { clearProps: "all", opacity: 1 });
        return;
      }

      ensureStormGsapPlugins();

      let splitInstance: SplitText | null = null;
      try {
        splitInstance = SplitText.create(el, {
          type: "lines,words",
          mask: "lines",
          aria: "auto",
          linesClass: "sm-split-line",
          wordsClass: "sm-split-word",
        });

        const targets =
          splitInstance.words.length > 0
            ? splitInstance.words
            : splitInstance.lines.length > 0
              ? splitInstance.lines
              : [el];

        gsap.fromTo(
          targets,
          {
            yPercent: 112,
            opacity: 0,
            filter: "blur(6px)",
          },
          {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.78 * preset.durationScale,
            stagger: 0.036 * preset.staggerScale,
            delay,
            ease: "expo.out",
            clearProps: "filter,transform",
          },
        );
      } catch {
        gsap.fromTo(
          el,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6 * preset.durationScale,
            delay,
            ease: "expo.out",
            clearProps: "transform",
          },
        );
      }

      return () => {
        splitInstance?.revert();
      };
    },
    {
      scope: hostRef,
      dependencies: [reducedMotion, intensity, replayKey, delay],
      revertOnUpdate: true,
    },
  );

  const Tag = as;
  return (
    <Tag
      ref={hostRef as never}
      id={id}
      className={`sm-split-headline ${className}`.trim()}
      data-fx="FX-01"
    >
      {children}
    </Tag>
  );
}
