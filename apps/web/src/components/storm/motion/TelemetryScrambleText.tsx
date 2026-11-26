import { useCallback, useRef } from "react";
import { ensureStormGsapPlugins, gsap, useGSAP } from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  type StormMotionIntensity,
} from "./motionConfig";

const TELEMETRY_CHARSET = "0123456789ABCDEF/·-+";

export interface TelemetryScrambleTextProps {
  readonly text: string;
  readonly className?: string;
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly replayKey?: number | string;
  readonly scrambleOnHover?: boolean;
}

/**
 * FX-02 — Pit-wall monospace decode effect powered by GSAP 3.15 ScrambleTextPlugin
 * (inspired by React Bits DecryptedText). Preserves `aria-label` so screen readers
 * always receive the true readable label without scrambled characters.
 */
export function TelemetryScrambleText({
  text,
  className = "",
  reducedMotion,
  intensity = "luxury",
  replayKey = 0,
  scrambleOnHover = true,
}: TelemetryScrambleTextProps) {
  const displayRef = useRef<HTMLSpanElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const preset = STORM_MOTION_PRESETS[intensity];

  const runDecode = useCallback(() => {
    const el = displayRef.current;
    if (!el || reducedMotion || typeof window === "undefined") {
      if (el) el.textContent = text;
      return;
    }

    ensureStormGsapPlugins();
    tweenRef.current?.kill();

    tweenRef.current = gsap.to(el, {
      duration: 0.62 * preset.durationScale,
      scrambleText: {
        text,
        chars: TELEMETRY_CHARSET,
        speed: 0.45,
        revealDelay: 0.08,
      },
      ease: "none",
    });
  }, [preset.durationScale, reducedMotion, text]);

  useGSAP(
    () => {
      runDecode();
      return () => {
        tweenRef.current?.kill();
        if (displayRef.current) {
          displayRef.current.textContent = text;
        }
      };
    },
    {
      dependencies: [text, reducedMotion, intensity, replayKey],
    },
  );

  return (
    <span
      className={`sm-scramble-host ${className}`.trim()}
      aria-label={text}
      data-fx="FX-02"
      onMouseEnter={scrambleOnHover ? runDecode : undefined}
      onFocus={scrambleOnHover ? runDecode : undefined}
    >
      <span ref={displayRef} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
