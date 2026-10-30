import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getIntroTiming,
  getStartLightsFrame,
  resolveIntroSpeed,
  START_LIGHT_CUE,
  type IntroSpeed,
} from './startLightsTiming';
import './F1StartLightsPreloader.css';

export const INTRO_SEEN_STORAGE_KEY = 'podium-start-lights-seen';

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

  const dismiss = useCallback(() => {
    try {
      window.sessionStorage?.setItem(INTRO_SEEN_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
    onComplete?.();
  }, [onComplete]);

  const visible = !dismissed && frame.phase !== 'complete';

  useEffect(() => {
    try {
      window.sessionStorage?.setItem(INTRO_SEEN_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const update = () => {
      const current = getStartLightsFrame(performance.now() - startedAt, timing);
      setFrame(current);
      if (current.phase === 'complete') {
        onComplete?.();
      }
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
      window.setTimeout(update, Math.max(0, deadline - (performance.now() - startedAt)) + 1),
    );

    const onVisible = () => {
      if (!document.hidden) update();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        dismiss();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      timers.forEach(window.clearTimeout);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dismiss, visible, startedAt, timing, onComplete]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;
  const { phase, litColumns } = frame;
  const racing = phase === 'lights-out' || phase === 'launch';

  return (
    <div
      role="dialog"
      aria-label="F1 Start Lights Preloader"
      className="podium-intro"
      data-phase={phase}
      data-speed={activeSpeed}
    >
      <div
        className="podium-intro__sheet"
        style={
          {
            '--intro-logo-hold': `${timing.logoHoldMs}ms`,
            '--intro-reveal-duration': `${timing.revealDurationMs}ms`,
            '--intro-grid-wake-duration': `${timing.gridWakeMs}ms`,
            '--intro-rack-wake-duration': `${timing.rackWakeMs}ms`,
            '--intro-sweep-duration': `${timing.sweepMs}ms`,
            '--intro-brand-sweep-duration': `${timing.brandSweepMs}ms`,
          } as React.CSSProperties
        }
      >
        <div className="podium-intro__edge" aria-hidden="true" />
        <div className="podium-intro__scene">
          <div className="podium-intro__grid" aria-hidden="true" />
          <div className="podium-intro__vignette" aria-hidden="true" />
          <div className="podium-intro__sweep" aria-hidden="true" />
          <div className="podium-intro__signature" aria-hidden="true">
            <strong>
              PODIUM<span>.</span>
            </strong>
            <span>EFFET DE SOL</span>
          </div>
          {!racing && (
            <div className="podium-intro__grid-stage">
              {litColumns > 0 && (
                <div key={litColumns} className="podium-intro__pressure" aria-hidden="true" />
              )}
              <p className="podium-intro__eyebrow">THE GRID IS SET.</p>
              <div
                className="podium-intro__rack"
                role="img"
                aria-label={`${litColumns} of 5 red lights on`}
              >
                {[1, 2, 3, 4, 5].map((column) => (
                  <div className="podium-intro__column" key={column}>
                    {[0, 1].map((lamp) => (
                      <span
                        key={lamp}
                        data-testid="start-light"
                        className={`podium-intro__lamp${column <= litColumns ? ' is-on' : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <p className="podium-intro__status">
                {phase === 'awakening'
                  ? 'PREPARING GRID...'
                  : phase === 'hold'
                    ? 'HOLD YOUR BREATH.'
                    : 'STAND BY FOR START'}
              </p>
              <div className="podium-intro__count" aria-hidden="true">
                <span>{String(litColumns).padStart(2, '0')}</span>
                <i />
                05
              </div>
            </div>
          )}
          {racing && (
            <>
              <div className="podium-intro__speed" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((line) => (
                  <i key={line} style={{ '--line': line } as React.CSSProperties} />
                ))}
              </div>
              {phase === 'launch' && (
                <div className="podium-intro__launch-brand" aria-label="PODIUM — Effet de Sol">
                  <strong>
                    PODIUM<span>.</span>
                  </strong>
                  <span>EFFET DE SOL</span>
                </div>
              )}
              {/* Kept mounted through the launch phase so the cue animates out
                  instead of vanishing on the phase switch. */}
              <div
                className={`podium-intro__cue${phase === 'launch' ? ' is-launching' : ''}`}
                role="status"
                aria-label={START_LIGHT_CUE}
                aria-hidden={phase === 'launch' || undefined}
              >
                <div aria-hidden="true">
                  <span className="podium-intro__its">IT&apos;S</span>
                  <strong>LIGHTS OUT.</strong>
                  <span className="podium-intro__away">AND AWAY WE GO!</span>
                </div>
              </div>
            </>
          )}
          {phase === 'lights-out' && <div className="podium-intro__flash" aria-hidden="true" />}
          <div className="podium-intro__footer" aria-hidden="true">
            <span>FIVE LIGHTS. ONE MOMENT.</span>
            <span>EFFET DE SOL ({activeSpeed.toUpperCase()})</span>
          </div>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="podium-intro__skip">
        Bỏ qua / Skip <span>ESC</span>
      </button>
    </div>
  );
};
