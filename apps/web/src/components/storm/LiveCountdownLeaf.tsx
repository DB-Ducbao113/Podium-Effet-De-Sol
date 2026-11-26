import { memo, useEffect, useState } from "react";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import { formatSynchronizedCountdown } from "./countdownFormat";
import { CountdownOdometer } from "./motion/OdometerNumber";

export interface LiveCountdownLeafProps {
  readonly targetEpochMs: number | null;
  readonly lang: "vi" | "en";
  readonly reducedMotion?: boolean;
  readonly className?: string;
}

/**
 * Isolated 1Hz countdown leaf (`REQ-03`, `REQ-04`, `REQ-13`, `REQ-14`).
 * - Applies authoritative UTC `clockOffsetMs` from `useTimezoneStore`.
 * - Updates ONLY this leaf once per second so parent views and 20–24 card grids
 *   incur zero re-renders per tick.
 * - Rolls individual digits smoothly via @number-flow/react when motion is active.
 * - Pauses automatically when `document.hidden === true` or `reducedMotion === true`.
 */
export const LiveCountdownLeaf = memo(function LiveCountdownLeaf({
  targetEpochMs,
  lang,
  reducedMotion = false,
  className,
}: LiveCountdownLeafProps) {
  const clockOffsetMs = useTimezoneStore((s) => s.clockOffsetMs);
  const [tickNow, setTickNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (
      targetEpochMs === null ||
      reducedMotion ||
      typeof window === "undefined"
    ) {
      return;
    }

    let timerId: number | null = null;

    const start = () => {
      if (timerId !== null || document.hidden) return;
      setTickNow(Date.now());
      timerId = window.setInterval(() => {
        if (!document.hidden) {
          setTickNow(Date.now());
        }
      }, 1000);
    };

    const stop = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, targetEpochMs]);

  const syncedNowMs = tickNow + clockOffsetMs;
  const label = formatSynchronizedCountdown(targetEpochMs, syncedNowMs, lang);
  const diff =
    targetEpochMs !== null && Number.isFinite(targetEpochMs)
      ? targetEpochMs - syncedNowMs
      : -1;
  const useRollingDigits =
    !reducedMotion && diff > 0 && typeof window !== "undefined";

  if (useRollingDigits) {
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor(diff / 3_600_000) % 24;
    const minutes = Math.floor(diff / 60_000) % 60;
    const seconds = Math.floor(diff / 1_000) % 60;

    return (
      <span
        className={className}
        data-testid="live-countdown-leaf"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        <CountdownOdometer
          days={days}
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          reducedMotion={false}
        />
      </span>
    );
  }

  return (
    <span
      className={className}
      data-testid="live-countdown-leaf"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {label}
    </span>
  );
});
