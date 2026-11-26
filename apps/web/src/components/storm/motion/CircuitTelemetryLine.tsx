import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useRef } from "react";
import { ensureStormGsapPlugins, gsap, useGSAP } from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  type StormMotionIntensity,
} from "./motionConfig";

export interface CircuitTelemetryLineProps {
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly replayKey?: number | string;
  readonly scrollTriggered?: boolean;
  readonly className?: string;
}

/**
 * FX-06 — Aerodynamic / circuit SVG vector trace powered by GSAP 3.15 DrawSVGPlugin
 * with optional ScrollTrigger activation and pit-wall telemetry node markers.
 */
export function CircuitTelemetryLine({
  reducedMotion,
  intensity = "luxury",
  replayKey = 0,
  scrollTriggered = true,
  className = "",
}: CircuitTelemetryLineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const preset = STORM_MOTION_PRESETS[intensity];

  useGSAP(
    () => {
      const svg = svgRef.current;
      if (!svg || typeof window === "undefined") return;

      const mainPath = svg.querySelector<SVGPathElement>(".sm-draw-main");
      const ghostPath = svg.querySelector<SVGPathElement>(".sm-draw-ghost");
      const nodes = svg.querySelectorAll<SVGCircleElement>(".sm-draw-node");
      if (!mainPath) return;

      if (reducedMotion) {
        gsap.set([mainPath, ghostPath].filter(Boolean), {
          clearProps: "strokeDashoffset,strokeDasharray",
          opacity: 1,
        });
        gsap.set(nodes, { scale: 1, opacity: 1 });
        return;
      }

      ensureStormGsapPlugins();
      gsap.registerPlugin(DrawSVGPlugin);

      const tl = gsap.timeline(
        scrollTriggered
          ? {
              scrollTrigger: {
                trigger: svg,
                start: "top 88%",
                once: true,
              },
            }
          : undefined,
      );

      tl.fromTo(
        mainPath,
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          duration: 1.15 * preset.durationScale,
          ease: "power3.inOut",
        },
        0,
      );

      if (ghostPath) {
        tl.fromTo(
          ghostPath,
          { drawSVG: "0%" },
          {
            drawSVG: "100%",
            duration: 1.35 * preset.durationScale,
            ease: "expo.out",
          },
          0.12,
        );
      }

      if (nodes.length > 0) {
        tl.fromTo(
          nodes,
          { scale: 0, opacity: 0, transformOrigin: "center center" },
          {
            scale: 1,
            opacity: 1,
            duration: 0.36 * preset.durationScale,
            stagger: 0.14 * preset.staggerScale,
            ease: "back.out(2)",
          },
          0.35,
        );
      }
    },
    {
      scope: svgRef,
      dependencies: [reducedMotion, intensity, replayKey, scrollTriggered],
      revertOnUpdate: true,
    },
  );

  return (
    <svg
      ref={svgRef}
      className={`sm-telemetry-line ${className}`.trim()}
      data-fx="FX-06"
      viewBox="0 0 960 92"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sm-aero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff4a18" />
          <stop offset="52%" stopColor="#f5f2ea" />
          <stop offset="100%" stopColor="#72e0ff" />
        </linearGradient>
      </defs>

      <path
        className="sm-draw-ghost"
        d="M 8 68 C 120 68, 152 24, 268 24 C 362 24, 392 70, 496 64 C 602 58, 636 16, 744 22 C 836 27, 880 56, 952 44"
        stroke="rgba(114, 224, 255, 0.22)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className="sm-draw-main"
        d="M 8 68 C 120 68, 152 24, 268 24 C 362 24, 392 70, 496 64 C 602 58, 636 16, 744 22 C 836 27, 880 56, 952 44"
        stroke="url(#sm-aero-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        className="sm-draw-node"
        cx="268"
        cy="24"
        r="4.5"
        fill="#ff4a18"
      />
      <circle
        className="sm-draw-node"
        cx="496"
        cy="64"
        r="4.5"
        fill="#f5f2ea"
      />
      <circle
        className="sm-draw-node"
        cx="744"
        cy="22"
        r="4.5"
        fill="#72e0ff"
      />
    </svg>
  );
}
