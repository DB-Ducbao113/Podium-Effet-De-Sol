import {
  useEffect,
  useRef,
  type MouseEventHandler,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ensureStormGsapPlugins, gsap } from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  clampBoundedOffset,
  isFinePointerDevice,
  type StormMotionIntensity,
} from "./motionConfig";

export interface MagneticButtonProps {
  readonly children: ReactNode;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly className?: string;
  readonly variant?: "primary" | "glass";
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly type?: "button" | "submit" | "reset";
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
}

/**
 * FX-05 — Magnetic liquid-glass CTA button (Codrops / Motion Primitives inspired).
 * Uses cached rect on pointerenter + GSAP quickTo for <= 8px bounded magnetic pull
 * and diagonal glass sheen sweep. Automatically disabled on touch & reducedMotion.
 */
export function MagneticButton({
  children,
  onClick,
  className = "",
  variant = "primary",
  reducedMotion,
  intensity = "luxury",
  type = "button",
  ariaLabel,
  disabled = false,
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const quickXRef = useRef<gsap.QuickToFunc | null>(null);
  const quickYRef = useRef<gsap.QuickToFunc | null>(null);
  const preset = STORM_MOTION_PRESETS[intensity];

  useEffect(() => {
    const el = btnRef.current;
    if (!el || reducedMotion || disabled || !isFinePointerDevice()) {
      quickXRef.current = null;
      quickYRef.current = null;
      if (el) gsap.set(el, { x: 0, y: 0, clearProps: "transform" });
      return;
    }

    ensureStormGsapPlugins();
    quickXRef.current = gsap.quickTo(el, "x", {
      duration: 0.28,
      ease: "power3.out",
    });
    quickYRef.current = gsap.quickTo(el, "y", {
      duration: 0.28,
      ease: "power3.out",
    });

    return () => {
      quickXRef.current = null;
      quickYRef.current = null;
      gsap.set(el, { x: 0, y: 0, clearProps: "transform" });
    };
  }, [disabled, intensity, reducedMotion]);

  const onPointerEnter = () => {
    if (
      reducedMotion ||
      disabled ||
      !btnRef.current ||
      !isFinePointerDevice()
    ) {
      return;
    }
    rectRef.current = btnRef.current.getBoundingClientRect();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (
      reducedMotion ||
      disabled ||
      !btnRef.current ||
      !isFinePointerDevice()
    ) {
      return;
    }
    if (!rectRef.current) {
      rectRef.current = btnRef.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);

    quickXRef.current?.(clampBoundedOffset(dx, preset.magneticMaxPx));
    quickYRef.current?.(clampBoundedOffset(dy, preset.magneticMaxPx));
  };

  const onPointerLeave = () => {
    rectRef.current = null;
    quickXRef.current?.(0);
    quickYRef.current?.(0);
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`sm-magnetic-btn sm-magnetic-btn--${variant} ${className}`.trim()}
      data-fx="FX-05"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {!reducedMotion ? (
        <span className="sm-magnetic-sheen" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}
