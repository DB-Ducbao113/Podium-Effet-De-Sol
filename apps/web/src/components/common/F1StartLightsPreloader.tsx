import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getIntroTiming,
  getStartLightsFrame,
  resolveIntroSpeed,
  START_LIGHT_CUE,
  type IntroSpeed,
} from "./startLightsTiming";
import "./F1StartLightsPreloader.css";

export const INTRO_SEEN_STORAGE_KEY = "podium-start-lights-seen";
const SKIP_DISSOLVE_MS = 260;

export interface F1StartLightsPreloaderProps {
  speed?: IntroSpeed;
  onComplete?: () => void;
}

export const F1StartLightsPreloader: React.FC<F1StartLightsPreloaderProps> = ({
  speed,
  onComplete,
}) => {
  const activeSpeed = useMemo(() => speed ?? resolveIntroSpeed(), [speed]);
  const timing = useMemo(() => getIntroTiming(activeSpeed), [activeSpeed]);
  const [frame, setFrame] = useState(() => getStartLightsFrame(0, timing));
  const [startedAt] = useState(() => performance.now());
  const [dismissed, setDismissed] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const completed = useRef(false);
  const skipping = useRef(false);
  const skipTimerRef = useRef<number | null>(null);

  const finalizeDismiss = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    try {
      window.sessionStorage?.setItem(INTRO_SEEN_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    document.documentElement.dataset.introState = "revealing";
    setDismissed(true);
    onComplete?.();
  }, [onComplete]);

  const requestSkip = useCallback(() => {
    if (completed.current || skipping.current) return;
    skipping.current = true;
    setIsSkipping(true);
    setIsRevealing(true);
    document.documentElement.dataset.introState = "revealing";
    skipTimerRef.current = window.setTimeout(finalizeDismiss, SKIP_DISSOLVE_MS);
  }, [finalizeDismiss]);

  const visible = !dismissed;

  useEffect(() => {
    try {
      window.sessionStorage?.setItem(INTRO_SEEN_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    return () => {
      if (skipTimerRef.current !== null) {
        window.clearTimeout(skipTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const elapsed = performance.now() - startedAt;
      const current = getStartLightsFrame(elapsed, timing);
      setFrame((previous) =>
        previous.phase === current.phase &&
        previous.litColumns === current.litColumns
          ? previous
          : current,
      );
    };

    const deadlines = [
      ...Array.from(
        { length: 5 },
        (_, index) => timing.firstLightMs + index * timing.lightIntervalMs,
      ),
      timing.lightsOutMs,
      timing.launchMs,
      timing.totalMs,
    ];
    const timers = deadlines.map((deadline) =>
      window.setTimeout(
        update,
        Math.max(0, deadline - (performance.now() - startedAt)) + 1,
      ),
    );

    // Trigger coordinated Storm Homepage reveal at the exact moment the
    // intro curtain begins lifting so both layers cross-choreograph cleanly.
    const revealStartMs = timing.launchMs + timing.logoHoldMs;
    const revealTimer = window.setTimeout(
      () => {
        if (completed.current) return;
        setIsRevealing(true);
        document.documentElement.dataset.introState = "revealing";
      },
      Math.max(0, revealStartMs - (performance.now() - startedAt)),
    );

    // Watchdog guarantees clean dismissal even if tab throttling delays CSS animationend.
    const watchdog = window.setTimeout(
      finalizeDismiss,
      Math.max(0, timing.totalMs + 900 - (performance.now() - startedAt)),
    );

    const onVisible = () => {
      if (!document.hidden) update();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === " ") {
        event.preventDefault();
        requestSkip();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(revealTimer);
      window.clearTimeout(watchdog);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finalizeDismiss, requestSkip, visible, startedAt, timing]);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  if (!visible) return null;
  const phase = frame.phase === "complete" ? "launch" : frame.phase;
  const { litColumns } = frame;
  const racing = phase === "lights-out" || phase === "launch";
  const pressureLevel = litColumns / 5;

  return (
    <div
      role="dialog"
      aria-label="F1 Start Lights Preloader"
      className="podium-intro"
      data-phase={phase}
      data-speed={activeSpeed}
      data-revealing={isRevealing ? "true" : undefined}
      data-skipping={isSkipping ? "true" : undefined}
      style={
        {
          "--intro-logo-hold": `${timing.logoHoldMs}ms`,
          "--intro-skip-duration": `${SKIP_DISSOLVE_MS}ms`,
        } as React.CSSProperties
      }
    >
      <div
        className="podium-intro__sheet"
        onAnimationEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.animationName === "podiumLaunchReveal"
          ) {
            finalizeDismiss();
          }
        }}
        style={
          {
            "--intro-logo-hold": `${timing.logoHoldMs}ms`,
            "--intro-reveal-duration": `${timing.revealDurationMs}ms`,
            "--intro-grid-wake-duration": `${timing.gridWakeMs}ms`,
            "--intro-rack-wake-duration": `${timing.rackWakeMs}ms`,
            "--intro-sweep-duration": `${timing.sweepMs}ms`,
            "--intro-brand-sweep-duration": `${timing.brandSweepMs}ms`,
          } as React.CSSProperties
        }
      >
        <div className="podium-intro__scene">
          <div className="podium-intro__atmosphere" aria-hidden="true" />
          <div className="podium-intro__grid" aria-hidden="true" />
          <div className="podium-intro__vignette" aria-hidden="true" />
          <div className="podium-intro__sweep" aria-hidden="true" />
          <div
            className="podium-intro__pressure"
            aria-hidden="true"
            style={
              {
                "--pressure-level": racing ? 0 : pressureLevel,
              } as React.CSSProperties
            }
          />

          <div className="podium-intro__signature" aria-hidden="true">
            <strong>
              PODIUM<span>.</span>
            </strong>
            <span>EFFET DE SOL</span>
          </div>

          <div
            className={`podium-intro__grid-stage${racing ? " is-exiting" : ""}`}
            aria-hidden={racing || undefined}
          >
            <p className="podium-intro__eyebrow">THE GRID IS SET.</p>
            <div
              className="podium-intro__rack"
              role="img"
              aria-label={`${litColumns} of 5 red lights on`}
            >
              {[1, 2, 3, 4, 5].map((column) => (
                <div
                  className="podium-intro__column"
                  key={column}
                  style={
                    {
                      "--lamp-delay": `${timing.firstLightMs + (column - 1) * timing.lightIntervalMs}ms`,
                    } as React.CSSProperties
                  }
                >
                  {[0, 1].map((lamp) => (
                    <span
                      key={lamp}
                      data-testid="start-light"
                      className={`podium-intro__lamp${column <= litColumns ? " is-on" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="podium-intro__status">
              {phase === "awakening"
                ? "PREPARING GRID..."
                : phase === "hold"
                  ? "HOLD YOUR BREATH."
                  : "STAND BY FOR START"}
            </p>
            <div className="podium-intro__count" aria-hidden="true">
              <span className="podium-intro__count-value">
                {String(litColumns).padStart(2, "0")}
              </span>
              <span className="podium-intro__count-rule" />
              05
            </div>
          </div>

          {racing && (
            <>
              <div className="podium-intro__speed" aria-hidden="true">
                {[0, 1, 2, 3].map((line) => (
                  <span
                    key={line}
                    style={{ "--line": line } as React.CSSProperties}
                  />
                ))}
              </div>

              {phase === "launch" && (
                <div
                  className="podium-intro__launch-brand"
                  aria-label="PODIUM — Effet de Sol"
                >
                  <span
                    className="podium-intro__launch-rule"
                    aria-hidden="true"
                  />
                  <strong>
                    PODIUM<span>.</span>
                  </strong>
                  <span>EFFET DE SOL</span>
                </div>
              )}

              <div
                className={`podium-intro__cue${phase === "launch" ? " is-launching" : ""}`}
                role="status"
                aria-label={START_LIGHT_CUE}
                aria-hidden={phase === "launch" || undefined}
              >
                <div aria-hidden="true">
                  <span className="podium-intro__its">IT&apos;S</span>
                  <strong>LIGHTS OUT.</strong>
                  <span className="podium-intro__away">AND AWAY WE GO!</span>
                </div>
              </div>
            </>
          )}

          {phase === "lights-out" && (
            <div className="podium-intro__flash" aria-hidden="true" />
          )}

          <div className="podium-intro__footer" aria-hidden="true">
            <span>FIVE LIGHTS. ONE MOMENT.</span>
            <span>EFFET DE SOL ({activeSpeed.toUpperCase()})</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={requestSkip}
        className="podium-intro__skip"
      >
        <span>Bỏ qua / Skip</span>
        <kbd>ESC</kbd>
      </button>
    </div>
  );
};
