import { useEffect, useMemo, useState } from "react";
import { CALENDAR_2026 } from "../../../data/championship";
import { useChampionshipStore } from "../../../store/useChampionshipStore";
import { useTimezoneStore } from "../../../store/useTimezoneStore";
import type { GrandPrixRound, Language, SeasonYear } from "../../../types";
import { effectiveTimeZone } from "../../../utils/championshipTimezone";
import {
  getCalendarRaceState,
  getSessionTimeRange,
} from "../../../utils/raceSchedule";
import { NAV_MICROCOPY } from "./navRegistry";
import type { DevNextRaceFixture } from "./navRouting";

export type NextRacePillStatus =
  "scheduled" | "current" | "loading" | "none" | "unavailable";

export interface NextRacePillState {
  readonly status: NextRacePillStatus;
  readonly text: string;
  readonly ariaLabel: string;
  readonly href: string | null;
  readonly isLiveWeekend: boolean;
  readonly gpShortName?: string;
  readonly formattedDate?: string;
}

export function formatShortGpName(gpName: string): string {
  return gpName.replace(/\s+Grand Prix$/i, " GP").trim();
}

export function formatShortRaceDate(
  gp: GrandPrixRound,
  tzPreference: string,
  lang: Language,
): string | null {
  const range = getSessionTimeRange(gp, "race");
  if (!range) return null;

  const locale = lang === "vi" ? "vi-VN" : "en-GB";
  return new Intl.DateTimeFormat(locale, {
    timeZone: effectiveTimeZone(tzPreference),
    day: "numeric",
    month: "short",
  }).format(range.start);
}

export interface DeriveNextRacePillInput {
  readonly calendar: readonly GrandPrixRound[];
  readonly completedRounds?: ReadonlySet<number>;
  readonly now?: number;
  readonly season?: SeasonYear;
  readonly tzPreference?: string;
  readonly lang: Language;
  readonly loading?: boolean;
  readonly unavailable?: boolean;
  readonly fixtureOverride?: DevNextRaceFixture;
}

/**
 * Pure schedule evaluator enforcing all 5 Next-Race Pill lifecycle states (BR-10).
 * Zero hardcoded fallback GP names or fabricated dates.
 */
export function deriveNextRacePillState({
  calendar,
  completedRounds = new Set<number>(),
  now = Date.now(),
  season = 2026,
  tzPreference = "local",
  lang,
  loading = false,
  unavailable = false,
  fixtureOverride,
}: DeriveNextRacePillInput): NextRacePillState {
  const calendarHref = `/season/${season}?tab=calendar`;

  if (fixtureOverride === "loading" || (loading && !fixtureOverride)) {
    return {
      status: "loading",
      text: NAV_MICROCOPY.loadingState[lang],
      ariaLabel: NAV_MICROCOPY.loadingState[lang],
      href: null,
      isLiveWeekend: false,
    };
  }

  if (
    fixtureOverride === "unavailable" ||
    (!fixtureOverride &&
      (unavailable || !Array.isArray(calendar) || calendar.length === 0))
  ) {
    return {
      status: "unavailable",
      text: NAV_MICROCOPY.unavailableState[lang],
      ariaLabel: NAV_MICROCOPY.unavailableState[lang],
      href: null,
      isLiveWeekend: false,
    };
  }

  if (fixtureOverride === "none") {
    return {
      status: "none",
      text: NAV_MICROCOPY.noneState[lang],
      ariaLabel: NAV_MICROCOPY.noneState[lang],
      href: calendarHref,
      isLiveWeekend: false,
    };
  }

  if (fixtureOverride === "current" || fixtureOverride === "scheduled") {
    const sampleGp =
      calendar.find((gp) => {
        if (completedRounds.has(gp.round) || gp.status === "completed") {
          return false;
        }
        const range = getSessionTimeRange(gp, "race");
        return range ? range.end.getTime() > now : true;
      }) ??
      calendar.find((gp) => gp.status !== "completed") ??
      calendar[calendar.length - 1];
    if (!sampleGp) {
      return {
        status: "unavailable",
        text: NAV_MICROCOPY.unavailableState[lang],
        ariaLabel: NAV_MICROCOPY.unavailableState[lang],
        href: null,
        isLiveWeekend: false,
      };
    }
    const gpShortName = formatShortGpName(sampleGp.name);
    const formattedDate =
      formatShortRaceDate(sampleGp, tzPreference, lang) ?? sampleGp.dates;
    const isCurrent = fixtureOverride === "current";
    const prefix = isCurrent
      ? NAV_MICROCOPY.currentWeekendLabel[lang]
      : NAV_MICROCOPY.nextRaceLabel[lang];
    const text = `${gpShortName} · ${formattedDate}`;
    return {
      status: isCurrent ? "current" : "scheduled",
      text,
      ariaLabel: `${prefix}: ${text}`,
      href: calendarHref,
      isLiveWeekend: isCurrent,
      gpShortName,
      formattedDate,
    };
  }

  let validScheduleCount = 0;
  let currentRound: GrandPrixRound | undefined;
  let nextScheduledRound: GrandPrixRound | undefined;

  for (const gp of calendar) {
    const raceRange = getSessionTimeRange(gp, "race");
    if (!raceRange) continue;
    validScheduleCount += 1;

    if (completedRounds.has(gp.round)) continue;

    const state = getCalendarRaceState(gp, now);
    if (state === "current" && !currentRound) {
      currentRound = gp;
      break;
    }

    if (raceRange.start.getTime() > now && !nextScheduledRound) {
      nextScheduledRound = gp;
    }
  }

  if (validScheduleCount === 0) {
    return {
      status: "unavailable",
      text: NAV_MICROCOPY.unavailableState[lang],
      ariaLabel: NAV_MICROCOPY.unavailableState[lang],
      href: null,
      isLiveWeekend: false,
    };
  }

  const chosen = currentRound ?? nextScheduledRound;
  if (!chosen) {
    return {
      status: "none",
      text: NAV_MICROCOPY.noneState[lang],
      ariaLabel: NAV_MICROCOPY.noneState[lang],
      href: calendarHref,
      isLiveWeekend: false,
    };
  }

  const gpShortName = formatShortGpName(chosen.name);
  const formattedDate =
    formatShortRaceDate(chosen, tzPreference, lang) ?? chosen.dates;
  const isCurrent = Boolean(currentRound);
  const prefix = isCurrent
    ? NAV_MICROCOPY.currentWeekendLabel[lang]
    : NAV_MICROCOPY.nextRaceLabel[lang];
  const text = `${gpShortName} · ${formattedDate}`;

  return {
    status: isCurrent ? "current" : "scheduled",
    text,
    ariaLabel: `${prefix}: ${text}`,
    href: calendarHref,
    isLiveWeekend: isCurrent,
    gpShortName,
    formattedDate,
  };
}

export interface UseNextRacePillOptions {
  readonly lang: Language;
  readonly season: SeasonYear;
  readonly fixtureOverride?: DevNextRaceFixture;
}

export function useNextRacePillState({
  lang,
  season,
  fixtureOverride,
}: UseNextRacePillOptions): NextRacePillState {
  const detailedResultsRaw = useChampionshipStore(
    (state) => state.detailedResults?.[2026],
  );
  const tzPreference = useTimezoneStore((state) => state.timeZone);
  const clockOffsetMs = useTimezoneStore((state) => state.clockOffsetMs);
  const [scheduleNow, setScheduleNow] = useState(
    () => Date.now() + clockOffsetMs,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setScheduleNow(Date.now() + clockOffsetMs);
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [clockOffsetMs]);

  const completedRounds = useMemo(() => {
    return new Set(
      (Array.isArray(detailedResultsRaw) ? detailedResultsRaw : [])
        .filter((race) => race && race.status === "completed")
        .map((race) => race.round),
    );
  }, [detailedResultsRaw]);

  return useMemo(
    () =>
      deriveNextRacePillState({
        calendar: CALENDAR_2026,
        completedRounds,
        now: scheduleNow,
        season,
        tzPreference,
        lang,
        fixtureOverride,
      }),
    [completedRounds, fixtureOverride, lang, scheduleNow, season, tzPreference],
  );
}
