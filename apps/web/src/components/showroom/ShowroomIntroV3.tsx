import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Language } from "../../types";
import {
  SHOWROOM_INTRO_COPY,
  SHOWROOM_INTRO_MEDIA,
  SHOWROOM_INTRO_REVEAL_AT,
  SHOWROOM_INTRO_REVEAL_MS,
  SHOWROOM_INTRO_STALL_MS,
  introProgress,
  nextIntroPhase,
  type ShowroomIntroPhase,
  type ShowroomIntroTier,
} from "./showroomIntroState";
import "./showroomIntroV3.css";

/** Sparks trailing from the tunnel mouth; deterministic so SSR and client match. */
const INTRO_EMBERS = [
  { x: "-150px", y: "120px", delay: "0s", duration: "2.8s" },
  { x: "130px", y: "160px", delay: "0.5s", duration: "3.2s" },
  { x: "-70px", y: "190px", delay: "1.1s", duration: "2.6s" },
  { x: "190px", y: "90px", delay: "1.7s", duration: "3.4s" },
  { x: "40px", y: "210px", delay: "0.9s", duration: "3s" },
  { x: "-200px", y: "70px", delay: "2.2s", duration: "2.9s" },
  { x: "100px", y: "120px", delay: "2.7s", duration: "3.3s" },
] as const;

type SurfaceProps = {
  lang: Language;
  tier: ShowroomIntroTier;
  phase: ShowroomIntroPhase;
  progress: number;
  videoRef: RefObject<HTMLVideoElement>;
  openRef: RefObject<HTMLButtonElement>;
  skipRef: RefObject<HTMLButtonElement>;
  onOpen: () => void;
  onEnter: () => void;
  onTimeUpdate: () => void;
};

/** Presentational gate/film markup, exported so SSR tests can render every phase. */
export function ShowroomIntroSurface({
  lang,
  tier,
  phase,
  progress,
  videoRef,
  openRef,
  skipRef,
  onOpen,
  onEnter,
  onTimeUpdate,
}: SurfaceProps) {
  const copy = SHOWROOM_INTRO_COPY[lang];
  return (
    <div
      className="sr-intro"
      data-phase={phase}
      data-tier={tier}
      role="dialog"
      aria-modal="false"
      aria-label={
        phase === "playing"
          ? copy.filmLabel
          : `${copy.title}${copy.titleEmphasis}`
      }
    >
      <div className="sr-intro-media" aria-hidden="true">
        <img
          className="sr-intro-poster"
          src={SHOWROOM_INTRO_MEDIA.poster}
          alt=""
        />
        {tier !== "T0" && (
          <video
            ref={videoRef}
            className="sr-intro-video"
            muted
            playsInline
            preload="none"
            poster={SHOWROOM_INTRO_MEDIA.poster}
            tabIndex={-1}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnter}
            onError={onEnter}
          >
            {tier === "T2" && (
              <source src={SHOWROOM_INTRO_MEDIA.webm} type="video/webm" />
            )}
            <source src={SHOWROOM_INTRO_MEDIA.mp4} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="sr-intro-scrim" aria-hidden="true" />
      <div className="sr-intro-top" aria-hidden="true" />
      <div className="sr-intro-veil" aria-hidden="true" />
      {phase === "playing" && (
        <div className="sr-intro-hit" aria-hidden="true" onClick={onEnter} />
      )}
      <div className="sr-intro-gate">
        <div className="sr-intro-rings" aria-hidden="true">
          <span className="sr-intro-rays" />
          <span className="sr-intro-glow" />
          <span className="sr-intro-ring sr-intro-ring--1" />
          <span className="sr-intro-ring sr-intro-ring--2" />
          <span className="sr-intro-ring sr-intro-ring--3" />
          <span className="sr-intro-embers">
            {INTRO_EMBERS.map((ember, index) => (
              <span
                key={index}
                className="sr-intro-ember"
                style={
                  {
                    "--ember-x": ember.x,
                    "--ember-y": ember.y,
                    animationDelay: ember.delay,
                    animationDuration: ember.duration,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        </div>
        <div className="sr-intro-gate-ui">
          <p className="sr-intro-eyebrow">{copy.eyebrow}</p>
          <h2 className="sr-intro-title">
            {copy.title}
            <em>{copy.titleEmphasis}</em>
          </h2>
          <button
            ref={openRef}
            type="button"
            className="sr-intro-open"
            onClick={onOpen}
          >
            {copy.open}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <button
        ref={skipRef}
        type="button"
        className="sr-intro-skip"
        onClick={onEnter}
      >
        {copy.skip}
        <span aria-hidden="true">›</span>
      </button>
      <div className="sr-intro-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

type Props = {
  lang: Language;
  tier: ShowroomIntroTier;
  onEnter: () => void;
  onDismissed: () => void;
};

/** Released gate and tunnel film in front of the existing Showroom. */
export default function ShowroomIntroV3({
  lang,
  tier,
  onEnter,
  onDismissed,
}: Props) {
  const [phase, setPhase] = useState<ShowroomIntroPhase>("gate");
  const [gone, setGone] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef<ShowroomIntroPhase>("gate");
  const enteredRef = useRef(false);
  const restoreFocusRef = useRef(true);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((next: ShowroomIntroPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (stallTimer.current) clearTimeout(stallTimer.current);
    revealTimer.current = null;
    stallTimer.current = null;
  }, []);

  const enter = useCallback(() => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    restoreFocusRef.current = false;
    clearTimers();
    videoRef.current?.pause();
    go(nextIntroPhase(phaseRef.current, "skip"));
    setProgress(1);
    onEnter();
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setGone(true);
      onDismissed();
    } else
      revealTimer.current = setTimeout(() => {
        setGone(true);
        onDismissed();
      }, SHOWROOM_INTRO_REVEAL_MS);
  }, [clearTimers, go, onEnter, onDismissed]);

  const open = useCallback(() => {
    if (phaseRef.current !== "gate" || enteredRef.current) return;
    const video = videoRef.current;
    if (tier === "T0" || !video) {
      enter();
      return;
    }
    go(nextIntroPhase(phaseRef.current, "open"));
    skipRef.current?.focus({ preventScroll: true });
    stallTimer.current = setTimeout(enter, SHOWROOM_INTRO_STALL_MS);
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(enter);
  }, [enter, go, tier]);

  useEffect(() => {
    const video = videoRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    openRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      enter();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      clearTimers();
      video?.pause();
      if (restoreFocusRef.current && previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [clearTimers, enter]);

  useEffect(() => {
    if (tier === "T0") return;
    const video = videoRef.current;
    if (!video) return;
    const onVisibility = () => {
      if (phaseRef.current !== "playing" || enteredRef.current) return;
      if (document.hidden) {
        video.pause();
        return;
      }
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(enter);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enter, tier]);

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || phaseRef.current !== "playing") return;
    setProgress(introProgress(video.currentTime, video.duration));
    if (video.currentTime >= SHOWROOM_INTRO_REVEAL_AT) enter();
  };

  if (gone) return null;

  const content = (
    <ShowroomIntroSurface
      lang={lang}
      tier={tier}
      phase={phase}
      progress={progress}
      videoRef={videoRef}
      openRef={openRef}
      skipRef={skipRef}
      onOpen={open}
      onEnter={enter}
      onTimeUpdate={onTimeUpdate}
    />
  );

  return typeof document === "undefined"
    ? content
    : createPortal(content, document.body);
}
