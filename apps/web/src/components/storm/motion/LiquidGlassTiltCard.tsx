import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ensureStormGsapPlugins, gsap } from "./gsapPlugins";
import {
  STORM_MOTION_PRESETS,
  computeCardTiltAngles,
  isFinePointerDevice,
  type StormMotionIntensity,
} from "./motionConfig";

export interface LiquidGlassTiltCardProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly reducedMotion: boolean;
  readonly intensity?: StormMotionIntensity;
  readonly borderBeam?: boolean;
  readonly accentColor?: string;
  readonly style?: CSSProperties;
}

/**
 * FX-04 — Storm Midnight Liquid Glass Card fusing:
 * - Magic UI animated conic Border-Beam
 * - React Bits cached-rect Pointer Spotlight specular refraction
 * - Aceternity subtle GPU 3D perspective tilt via GSAP quickTo (<= 5.5 deg)
 * Zero per-frame getBoundingClientRect() reflows; disabled on coarse pointers & reducedMotion.
 */
export function LiquidGlassTiltCard({
  children,
  className = "",
  reducedMotion,
  intensity = "luxury",
  borderBeam = true,
  accentColor,
  style,
}: LiquidGlassTiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const quickXRef = useRef<gsap.QuickToFunc | null>(null);
  const quickYRef = useRef<gsap.QuickToFunc | null>(null);
  const preset = STORM_MOTION_PRESETS[intensity];

  useEffect(() => {
    const card = cardRef.current;
    if (!card || reducedMotion || !isFinePointerDevice()) {
      quickXRef.current = null;
      quickYRef.current = null;
      if (card) {
        gsap.set(card, { rotateX: 0, rotateY: 0, clearProps: "transform" });
      }
      return;
    }

    ensureStormGsapPlugins();
    quickXRef.current = gsap.quickTo(card, "rotateX", {
      duration: 0.32,
      ease: "power3.out",
    });
    quickYRef.current = gsap.quickTo(card, "rotateY", {
      duration: 0.32,
      ease: "power3.out",
    });

    const invalidateRect = () => {
      rectRef.current = null;
    };
    window.addEventListener("scroll", invalidateRect, { passive: true });
    window.addEventListener("resize", invalidateRect, { passive: true });

    return () => {
      window.removeEventListener("scroll", invalidateRect);
      window.removeEventListener("resize", invalidateRect);
      quickXRef.current = null;
      quickYRef.current = null;
      gsap.set(card, { rotateX: 0, rotateY: 0, clearProps: "transform" });
    };
  }, [reducedMotion, intensity]);

  const onPointerEnter = () => {
    if (reducedMotion || !cardRef.current || !isFinePointerDevice()) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
    cardRef.current.setAttribute("data-sm-lit", "true");
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (reducedMotion || !card || !isFinePointerDevice()) return;
    if (!rectRef.current) {
      rectRef.current = card.getBoundingClientRect();
    }
    const rect = rectRef.current;
    if (rect.width <= 0 || rect.height <= 0) return;

    const normX = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const normY = Math.max(
      0,
      Math.min(1, (event.clientY - rect.top) / rect.height),
    );

    card.style.setProperty("--sm-mx", `${(normX * 100).toFixed(1)}%`);
    card.style.setProperty("--sm-my", `${(normY * 100).toFixed(1)}%`);

    const { rotateX, rotateY } = computeCardTiltAngles(
      normX,
      normY,
      preset.tiltMaxDeg,
    );
    quickXRef.current?.(rotateX);
    quickYRef.current?.(rotateY);
  };

  const onPointerLeave = () => {
    const card = cardRef.current;
    rectRef.current = null;
    if (!card) return;
    card.removeAttribute("data-sm-lit");
    quickXRef.current?.(0);
    quickYRef.current?.(0);
  };

  const mergedStyle: CSSProperties = {
    ...style,
    ...(accentColor
      ? ({ "--sm-card-accent": accentColor } as CSSProperties)
      : {}),
    ["--sm-beam-opacity" as string]: reducedMotion ? 0 : preset.beamOpacity,
  };

  return (
    <div className="sm-tilt-stage">
      <div
        ref={cardRef}
        className={`sm-glass-card ${borderBeam && !reducedMotion ? "has-border-beam" : ""} ${className}`.trim()}
        data-fx="FX-04"
        style={mergedStyle}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {borderBeam && !reducedMotion ? (
          <span className="sm-border-beam" aria-hidden="true" />
        ) : null}
        <span className="sm-card-spotlight" aria-hidden="true" />
        <div className="sm-glass-card-inner">{children}</div>
      </div>
    </div>
  );
}
