import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INTRO_SEEN_STORAGE_KEY } from "../common/F1StartLightsPreloader";
import { OfficialBrandLogo } from "../common/OfficialBrandLogo";
import "./cinematicStartGantry.css";
import { markSandboxIntroConsumed } from "./engineeringLabRoutes";
import {
  CINEMATIC_GANTRY_TIMING,
  REDUCED_GANTRY_TIMING,
  SANDBOX_INTRO_SEEN_KEY,
  evaluateStartGantryFrame,
} from "./startGantryTiming";

export interface CinematicStartGantryIntroProps {
  readonly lang: "vi" | "en";
  readonly reducedMotion: boolean;
  readonly divisionLabel?: string;
  readonly syncDocumentIntroHooks?: boolean;
  readonly initialElapsedMs?: number;
  readonly onComplete: () => void;
}

const SKIP_DURATION_MS = 120;

interface MiniF1CarSpec {
  readonly id: string;
  readonly laneTopPct: number;
  readonly scale: number;
  readonly delayMs: number;
  readonly durationMs: number;
  readonly bodyPrimary: string;
  readonly accentColor: string;
  readonly helmetColor: string;
  readonly zOrder: number;
}

const MINI_F1_PACK: readonly MiniF1CarSpec[] = [
  {
    id: "p2-ice-cyan",
    laneTopPct: 57,
    scale: 0.9,
    delayMs: 85,
    durationMs: 1120,
    bodyPrimary: "#132033",
    accentColor: "#72e0ff",
    helmetColor: "#72e0ff",
    zOrder: 2,
  },
  {
    id: "p5-silver-aero",
    laneTopPct: 63,
    scale: 0.82,
    delayMs: 250,
    durationMs: 1160,
    bodyPrimary: "#1a2638",
    accentColor: "#c8d6e8",
    helmetColor: "#f5f2ea",
    zOrder: 1,
  },
  {
    id: "p4-amber-storm",
    laneTopPct: 69,
    scale: 0.94,
    delayMs: 170,
    durationMs: 1140,
    bodyPrimary: "#211624",
    accentColor: "#ff8a2b",
    helmetColor: "#ffb84d",
    zOrder: 3,
  },
  {
    id: "p1-crimson-lead",
    laneTopPct: 75,
    scale: 1.12,
    delayMs: 0,
    durationMs: 1080,
    bodyPrimary: "#241116",
    accentColor: "#ff4a18",
    helmetColor: "#ff4a18",
    zOrder: 5,
  },
  {
    id: "p3-ivory-apex",
    laneTopPct: 81,
    scale: 1.0,
    delayMs: 125,
    durationMs: 1100,
    bodyPrimary: "#121d30",
    accentColor: "#f5f2ea",
    helmetColor: "#72e0ff",
    zOrder: 4,
  },
] as const;

const MiniF1RaceCarSvg: React.FC<{
  readonly spec: MiniF1CarSpec;
  readonly uid: string;
}> = ({ spec, uid }) => {
  const trailGradId = `peds-f1-trail-${uid}-${spec.id}`;
  const sprayGradId = `peds-f1-spray-${uid}-${spec.id}`;
  return (
    <svg
      viewBox="0 0 380 86"
      className="peds-gantry-intro__f1-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={trailGradId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={spec.accentColor} stopOpacity="0" />
          <stop offset="48%" stopColor={spec.accentColor} stopOpacity="0.48" />
          <stop offset="88%" stopColor="#ffffff" stopOpacity="0.92" />
          <stop offset="100%" stopColor={spec.accentColor} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={sprayGradId} x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#72e0ff" stopOpacity="0" />
          <stop offset="55%" stopColor="#cfefff" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.46" />
        </linearGradient>
      </defs>

      {/* Wet rooster-tail rain spray plumes */}
      <path
        d="M 18 28 Q 92 14 188 46 L 188 64 Q 88 68 8 54 Z"
        fill={`url(#${sprayGradId})`}
      />
      <path
        d="M 56 18 Q 122 20 192 42 L 186 54 Q 116 44 44 36 Z"
        fill={`url(#${sprayGradId})`}
      />

      {/* High-velocity aerodynamic slipstream light ribbons */}
      <rect
        x="0"
        y="46"
        width="196"
        height="3.2"
        rx="1.6"
        fill={`url(#${trailGradId})`}
      />
      <rect
        x="38"
        y="35"
        width="156"
        height="1.6"
        rx="0.8"
        fill={`url(#${trailGradId})`}
        opacity="0.82"
      />
      <rect
        x="62"
        y="61"
        width="164"
        height="2"
        rx="1"
        fill="rgba(255, 74, 24, 0.72)"
      />

      {/* Titanium skid-block plank sparks off the wet asphalt */}
      <line
        x1="138"
        y1="67"
        x2="198"
        y2="63"
        stroke="#ffb84d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="154"
        y1="72"
        x2="208"
        y2="64"
        stroke="#ff4a18"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="172"
        y1="58"
        x2="214"
        y2="63"
        stroke="#fff3d1"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Rear wing assembly + endplate */}
      <path
        d="M 188 26 L 208 26 L 214 52 L 194 52 Z"
        fill={spec.bodyPrimary}
        stroke={spec.accentColor}
        strokeWidth="1.3"
      />
      <path d="M 186 23 L 210 25 L 208 30 L 185 28 Z" fill={spec.accentColor} />

      {/* Pulsing Red FIA Rear Rain-Light */}
      <circle
        cx="191"
        cy="54"
        r="3.4"
        fill="#ff3b1f"
        data-f1-rain-light="true"
      />
      <circle cx="191" cy="54" r="7" fill="rgba(255, 59, 31, 0.42)" />

      {/* Venturi Underfloor Plank & Diffuser */}
      <path
        d="M 192 61 L 358 61 L 368 58 L 350 64 L 190 64 Z"
        fill="#070b12"
      />
      <line
        x1="216"
        y1="62.5"
        x2="338"
        y2="62.5"
        stroke="#72e0ff"
        strokeWidth="1.2"
        opacity="0.85"
      />

      {/* Engine Cover, Shark Fin, Sidepod & Low-Rake Nosecone */}
      <path
        d="M 204 54 L 212 31 L 252 29 L 274 38 L 314 43 L 362 53 L 364 58 L 204 59 Z"
        fill={spec.bodyPrimary}
        stroke="rgba(245, 242, 234, 0.28)"
        strokeWidth="1"
      />
      <path
        d="M 214 44 L 266 39 L 336 51 L 326 55 L 216 50 Z"
        fill={spec.accentColor}
      />

      {/* Driver Helmet + Grade-5 Titanium Halo */}
      <circle cx="273" cy="36" r="5.2" fill={spec.helmetColor} />
      <path
        d="M 262 38 Q 278 27 294 40"
        fill="none"
        stroke="#e9edf2"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="283"
        y1="33"
        x2="288"
        y2="41"
        stroke="#e9edf2"
        strokeWidth="2.2"
      />

      {/* Front Wing & Swept 2026 Endplate */}
      <path
        d="M 344 54 L 374 54 L 378 62 L 342 62 Z"
        fill={spec.accentColor}
      />
      <path d="M 352 48 L 368 49 L 372 61 L 356 61 Z" fill={spec.bodyPrimary} />

      {/* Rear 18-Inch Wheel + Glowing Carbon Brake Disc Arc */}
      <g>
        <circle
          cx="224"
          cy="57"
          r="14.5"
          fill="#090d14"
          stroke="#2c3748"
          strokeWidth="2.4"
        />
        <circle
          cx="224"
          cy="57"
          r="8.5"
          fill="#121926"
          stroke={spec.accentColor}
          strokeWidth="1.2"
        />
        <path
          d="M 217 52 A 8 8 0 0 1 229 50"
          fill="none"
          stroke="#ff4a18"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* Front 18-Inch Wheel + Glowing Carbon Brake Disc Arc */}
      <g>
        <circle
          cx="330"
          cy="57"
          r="14"
          fill="#090d14"
          stroke="#2c3748"
          strokeWidth="2.4"
        />
        <circle
          cx="330"
          cy="57"
          r="8"
          fill="#121926"
          stroke="#72e0ff"
          strokeWidth="1.2"
        />
        <path
          d="M 323 52 A 7.5 7.5 0 0 1 335 50"
          fill="none"
          stroke="#ff4a18"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export const CinematicStartGantryIntro: React.FC<
  CinematicStartGantryIntroProps
> = ({
  lang,
  reducedMotion,
  divisionLabel,
  syncDocumentIntroHooks = false,
  initialElapsedMs = 0,
  onComplete,
}) => {
  const isVi = lang === "vi";
  const resolvedDivisionLabel =
    divisionLabel ??
    (isVi ? "PHÂN KHU KỸ THUẬT ĐUA XE" : "ENGINEERING DIVISION");
  const svgUid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const timing = useMemo(
    () => (reducedMotion ? REDUCED_GANTRY_TIMING : CINEMATIC_GANTRY_TIMING),
    [reducedMotion],
  );
  const [startedAt] = useState(() => performance.now() - initialElapsedMs);
  const [frame, setFrame] = useState(() =>
    evaluateStartGantryFrame(initialElapsedMs, timing),
  );
  const [isSkipping, setIsSkipping] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const watchdogRef = useRef<number | null>(null);
  const skipTimerRef = useRef<number | null>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);

    const clearScheduledTimers = useCallback(() => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
      if (watchdogRef.current !== null) {
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    }, []);

    const markStorageSeen = useCallback(() => {
      if (!syncDocumentIntroHooks) {
        markSandboxIntroConsumed();
      }
      try {
        window.sessionStorage?.setItem(
          syncDocumentIntroHooks
            ? INTRO_SEEN_STORAGE_KEY
            : SANDBOX_INTRO_SEEN_KEY,
          "1",
        );
      } catch {
        // storage unavailable in restricted contexts
      }
    }, [syncDocumentIntroHooks]);

    const finishIntro = useCallback(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      clearScheduledTimers();
      markStorageSeen();
      if (syncDocumentIntroHooks && typeof document !== "undefined") {
        document.documentElement.dataset.introState = "revealing";
      }
      onComplete();
    }, [clearScheduledTimers, markStorageSeen, onComplete, syncDocumentIntroHooks]);

    const handleSkip = useCallback(() => {
      if (completedRef.current) return;
      clearScheduledTimers();
      setIsSkipping(true);
      if (syncDocumentIntroHooks && typeof document !== "undefined") {
        document.documentElement.dataset.introState = "revealing";
      }
      if (skipTimerRef.current !== null) {
        window.clearTimeout(skipTimerRef.current);
      }
      skipTimerRef.current = window.setTimeout(finishIntro, SKIP_DURATION_MS);
    }, [clearScheduledTimers, finishIntro, syncDocumentIntroHooks]);

    useEffect(() => {
      skipButtonRef.current?.focus({ preventScroll: true });
      markStorageSeen();
      if (!syncDocumentIntroHooks || typeof document === "undefined") return;

      const previousOverflow = document.body.style.overflow;
      const previousIntroActive = document.documentElement.dataset.introActive;
      document.body.style.overflow = "hidden";
      document.documentElement.dataset.introActive = "true";
      if (document.documentElement.dataset.introState !== "revealing") {
        document.documentElement.dataset.introState = "active";
      }
      return () => {
        document.body.style.overflow = previousOverflow;
        if (previousIntroActive === undefined) {
          delete document.documentElement.dataset.introActive;
        } else {
          document.documentElement.dataset.introActive = previousIntroActive;
        }
      };
    }, [markStorageSeen, syncDocumentIntroHooks]);

    useEffect(() => {
      const syncFrame = () => {
        if (completedRef.current) return;
        const elapsed = performance.now() - startedAt;
        const next = evaluateStartGantryFrame(elapsed, timing);
        setFrame(next);
        if (
          syncDocumentIntroHooks &&
          next.phase === "shutter-reveal" &&
          typeof document !== "undefined"
        ) {
          document.documentElement.dataset.introState = "revealing";
        }
        if (next.phase === "complete") {
          finishIntro();
        }
      };

      const milestones = [
        0,
        ...Array.from(
          { length: 5 },
          (_, idx) => timing.firstLightMs + idx * timing.lightIntervalMs,
        ),
        timing.lightsOutMs,
        timing.brandLaunchMs,
        timing.shutterOpenMs,
        timing.totalMs,
      ];

      timersRef.current = milestones.map((ms) =>
        window.setTimeout(
          syncFrame,
          Math.max(0, ms - (performance.now() - startedAt)) + 2,
        ),
      );
      watchdogRef.current = window.setTimeout(finishIntro, timing.totalMs + 450);

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === " ") {
          event.preventDefault();
          handleSkip();
        } else if (event.key === "Tab") {
          event.preventDefault();
          skipButtonRef.current?.focus({ preventScroll: true });
        }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => {
        clearScheduledTimers();
        if (skipTimerRef.current !== null) {
          window.clearTimeout(skipTimerRef.current);
        }
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [
      clearScheduledTimers,
      finishIntro,
      handleSkip,
      startedAt,
      syncDocumentIntroHooks,
      timing,
    ]);

    const isPostBlackout =
      frame.phase === "lights-out" ||
      frame.phase === "brand-launch" ||
      frame.phase === "shutter-reveal";
    const isLightsOutBeat = frame.phase === "lights-out";
    const isBrandBeat =
      frame.phase === "brand-launch" || frame.phase === "shutter-reveal";

    const statusCopy =
      frame.phase === "awakening"
        ? isVi
          ? "ĐANG KÍCH HOẠT GIÀN ĐÈN XUẤT PHÁT..."
          : "ARMING FIA OVERHEAD START GANTRY..."
        : frame.phase === "hold"
          ? isVi
            ? "GIỮ VÒNG TUA · CHỜ TẮT ĐÈN"
            : "CLUTCH BITE · HOLD FOR LIGHTS OUT"
          : frame.phase === "sequence"
            ? isVi
              ? "ÁP SUẤT VẠCH XUẤT PHÁT TĂNG DẦN"
              : "GRID SEQUENCE IN PROGRESS"
            : "IT'S LIGHTS OUT AND AWAY WE GO!";

  return (
    <div
      role="dialog"
      lang={lang}
      aria-modal="true"
      aria-label={
        isVi
          ? "Màn mở đầu xuất phát F1 Podium EDS"
          : "Podium EDS F1 Start Lights & Grid Launch Intro"
      }
      data-testid="cinematic-start-gantry-intro"
      data-phase={frame.phase}
      data-scene-theme={frame.sceneTheme}
      data-skipping={isSkipping ? "true" : undefined}
      className="peds-gantry-intro"
      style={
        {
          "--gantry-flare": frame.flareIntensity,
          "--gantry-scale": frame.cameraPushScale,
          "--gantry-lights-out-ms": `${Math.max(180, timing.brandLaunchMs - timing.lightsOutMs)}ms`,
          "--gantry-brand-ms": `${Math.max(180, timing.shutterOpenMs - timing.brandLaunchMs)}ms`,
          "--gantry-wipe-ms": `${Math.max(180, timing.totalMs - timing.shutterOpenMs)}ms`,
        } as React.CSSProperties
      }
    >
      <div className="peds-gantry-intro__curtain" aria-hidden="true">
        <div className="peds-gantry-intro__rain" />
        <div className="peds-gantry-intro__storm-streaks" />
        <div className="peds-gantry-intro__asphalt" />
      </div>
      <div className="peds-gantry-intro__wipe-edge" aria-hidden="true" />

        <div
          className={`peds-gantry-intro__stage${isLightsOutBeat ? " is-clutch-bite" : ""
            }`}
        >
          <div
            className="peds-gantry-intro__anamorphic-flare"
            aria-hidden="true"
          />

          {!isBrandBeat && (
            <div
              className={`peds-gantry-intro__bridge${
                isLightsOutBeat ? " is-lights-out" : ""
              }`}
            >
              <span className="peds-gantry-intro__mono mb-5 text-[11px] text-[#9eb0c6]">
                {isVi
                  ? "PODIUM EDS · GIÀN ĐÈN ĐIỀU HÀNH XUẤT PHÁT"
                  : "PODIUM EDS · RACE CONTROL GANTRY"}
              </span>
              <div className="peds-gantry-intro__truss" aria-hidden="true" />
              <div
                className="peds-gantry-intro__rack"
                role="img"
                aria-label={`${frame.litColumns} / 5 start light columns active`}
              >
                {[1, 2, 3, 4, 5].map((col) => {
                  const isLit = !isPostBlackout && col <= frame.litColumns;
                  return (
                    <div key={col} className="peds-gantry-intro__pod">
                      <span
                        data-testid={`gantry-aux-lamp-${col}`}
                        className={`peds-gantry-intro__lens peds-gantry-intro__lens--aux${isLit ? " is-lit" : ""}`}
                      />
                      <span
                        data-testid={`gantry-main-lamp-${col}`}
                        className={`peds-gantry-intro__lens${isLit ? " is-lit" : ""}`}
                      />
                      <span className="peds-gantry-intro__mono text-[9px] text-[#7d899b]">
                        0{col}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="peds-gantry-intro__readout">
                <p
                  className="peds-gantry-intro__mono text-xs text-[#f5f2ea]"
                  data-testid="gantry-status-text"
                >
                  {statusCopy}
                </p>
                <div className="peds-gantry-intro__mono flex items-center gap-3 text-[11px] text-[#9eb0c6]">
                  <span className="text-[#72e0ff]">
                    0{frame.litColumns} / 05
                  </span>
                  <span>·</span>
                  <span>
                    {isPostBlackout
                      ? isVi
                        ? "0MS NGẮT ĐÈN TỨC THỜI"
                        : "0MS FIA SNAP-OFF"
                      : frame.phase === "hold"
                        ? isVi
                          ? "ÁP SUẤT CỰC ĐẠI"
                          : "MAX PRESSURE"
                        : isVi
                          ? "CHUỖI ĐÈN FIA"
                          : "FIA SEQUENCE"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isLightsOutBeat && (
            <div className="peds-gantry-intro__lights-out-scene">
              <div
                className="peds-gantry-intro__ignition-flash"
                data-testid="gantry-ignition-flash"
                aria-hidden="true"
              />
              <div className="peds-gantry-intro__speed-lines" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <span
                    key={idx}
                    style={{ "--gantry-line-idx": idx } as React.CSSProperties}
                  />
                ))}
              </div>
              <div
                className="peds-gantry-intro__lights-out-cue"
                role="status"
                aria-label="IT'S LIGHTS OUT AND AWAY WE GO!"
                data-testid="gantry-lights-out-banner"
              >
                <span className="peds-gantry-intro__cue-its">IT&apos;S</span>
                <strong className="peds-gantry-intro__cue-main">
                  LIGHTS OUT.
                </strong>
                <span className="peds-gantry-intro__cue-away">
                  AND AWAY WE GO!
                </span>
              </div>
            </div>
          )}

          {isBrandBeat && (
            <div
              className="peds-gantry-intro__pack-stage"
              data-testid="gantry-brand-detonation"
            >
              <div
                className="peds-gantry-intro__brand-stage"
                role="status"
                aria-label="PODIUM — Effet de Sol"
                data-testid="gantry-brand-reveal"
              >
                <div className="peds-gantry-intro__full-logo-wrap">
                  <OfficialBrandLogo
                    variant="full"
                    size="xl"
                    className="peds-gantry-intro__full-logo"
                  />
                </div>
                <span
                  className="peds-gantry-intro__brand-rule"
                  aria-hidden="true"
                />
                {resolvedDivisionLabel ? (
                  <span
                    className="peds-gantry-intro__brand-division"
                    data-testid="gantry-brand-division"
                  >
                    {resolvedDivisionLabel}
                  </span>
                ) : null}
              </div>

              <div
                className="peds-gantry-intro__f1-pack"
                data-testid="gantry-f1-mini-pack"
                aria-hidden="true"
              >
                <div className="peds-gantry-intro__track-kerb" />
                {MINI_F1_PACK.map((car) => (
                  <div
                    key={car.id}
                    className="peds-gantry-intro__f1-lane"
                    style={
                      {
                        top: `${car.laneTopPct}%`,
                        zIndex: car.zOrder,
                        "--f1-car-delay": `${car.delayMs}ms`,
                        "--f1-car-duration": `${car.durationMs}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <div
                      data-f1-mini-car="true"
                      data-car-id={car.id}
                      className="peds-gantry-intro__f1-car-runner"
                      style={
                        {
                          "--f1-car-scale": car.scale,
                        } as React.CSSProperties
                      }
                    >
                      <MiniF1RaceCarSvg spec={car} uid={svgUid} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          ref={skipButtonRef}
          type="button"
          onClick={handleSkip}
          data-testid="gantry-skip-btn"
          className="peds-gantry-intro__skip"
        >
          <span>{isVi ? "Bỏ qua Intro" : "Skip Intro"}</span>
          <kbd>ESC</kbd>
        </button>
      </div>
    );
  };
