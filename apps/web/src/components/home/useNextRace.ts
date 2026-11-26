import { useEffect, useMemo, useState } from "react";
import { CALENDAR_2026 } from "../../data/championship";
import { useChampionshipStore } from "../../store/useChampionshipStore";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import { getSessionTimeRange } from "../../utils/raceSchedule";
import type { GrandPrixRound } from "../../types";

/**
 * Single source for the next live Grand Prix, shared by the Launch Control
 * instrument strip and Race Control so both read the same verified schedule.
 * The clock refreshes on a calm interval, on tab focus, and at lights out so
 * the next countdown does not wait for the next interval tick.
 */
export function useNextRace(): GrandPrixRound | undefined {
  const detailedResultsRaw = useChampionshipStore(
    (state) => state.detailedResults?.[2026],
  );
  const clockOffsetMs = useTimezoneStore((state) => state.clockOffsetMs);
  const [scheduleNow, setScheduleNow] = useState(
    () => Date.now() + clockOffsetMs,
  );

  useEffect(() => {
    const refresh = () => setScheduleNow(Date.now() + clockOffsetMs);
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [clockOffsetMs]);

  const nextRace = useMemo(() => {
    const completed = new Set(
      (Array.isArray(detailedResultsRaw) ? detailedResultsRaw : [])
        .filter((race) => race && race.status === "completed")
        .map((race) => race.round),
    );
    return selectNextRaceForCountdown(CALENDAR_2026, completed, scheduleNow);
  }, [detailedResultsRaw, scheduleNow]);

  useEffect(() => {
    const start =
      nextRace && getSessionTimeRange(nextRace, "race")?.start.getTime();
    if (start === undefined) return;
    const timeout = window.setTimeout(
      () => setScheduleNow(Date.now() + clockOffsetMs),
      nextRaceRefreshDelay(start, Date.now() + clockOffsetMs),
    );
    return () => window.clearTimeout(timeout);
  }, [nextRace, scheduleNow, clockOffsetMs]);

  return nextRace;
}

export function nextRaceRefreshDelay(start: number, now: number): number {
  return Math.min(Math.max(0, start - now), 2_147_483_647);
}

export function selectNextRaceForCountdown(
  calendar: GrandPrixRound[],
  completedRounds: ReadonlySet<number>,
  now: number,
): GrandPrixRound | undefined {
  return calendar.find((race) => {
    if (completedRounds.has(race.round)) return false;
    const start = getSessionTimeRange(race, "race")?.start.getTime();
    return start !== undefined && start > now;
  });
}
