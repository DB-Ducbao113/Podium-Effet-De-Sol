import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MiniRaceCar } from "../championship/mini-race/MiniRaceCar";
import { AutoTimezoneBadge } from "../common/AutoTimezoneBadge";
import { DETAILED_RACE_RESULTS_2024 } from "../../data/championship/detailedResults2024";
import { DETAILED_RACE_RESULTS_2026 } from "../../data/championship/detailedResults2026";
import openF1SessionResults from "../../data/championship/openF1SessionResults2026.json";
import {
  getCompleteRaceClassification,
  getSeasonDriverNumber,
} from "../../data/championship/raceClassificationHelper";
import { DRIVERS_DATA } from "../../data/drivers";
import { TEAMS_DATA } from "../../data/teams";
import { getTeamSeasonProfile } from "../../data/teamSeasons";
import {
  getAvailableSessions,
  getSessionClassification,
  type ClassificationRow,
  type ResultDataSources,
  type ResultSessionKey,
} from "../../results-engine/availability";
import { useTimezoneStore } from "../../store/useTimezoneStore";
import type {
  ConstructorStanding,
  DriverStanding,
  GrandPrixRound,
  RaceResult,
  SeasonYear,
} from "../../types";
import type { GrandPrixPracticeData } from "../../types/practice";
import type { GrandPrixQualifyingData } from "../../types/qualifying";
import {
  effectiveTimeZone,
  formatRaceSessionTime,
  zoneOffsetLabel,
} from "../../utils/championshipTimezone";
import { getSessionTimeRange } from "../../utils/raceSchedule";
import { resolveTeamId, TEAM_TEXT_PALETTE } from "../../utils/teamColors";
import { LiveCountdownLeaf } from "./LiveCountdownLeaf";
import { StormVisualImage } from "./StormVisualImage";
import type { StormInspectionTarget } from "./types";
import {
  useKineticNumber,
  useLiquidPointerGlow,
  useSlidingGlassPill,
  useViewportReveal,
} from "./useLiquidGlassMotion";

const SEASONS: readonly SeasonYear[] = [2024, 2025, 2026];
const EMPTY_PRACTICE: Readonly<Record<number, GrandPrixPracticeData>> = {};
const EMPTY_QUALIFYING: Readonly<Record<number, GrandPrixQualifyingData>> = {};
const OPEN_2026_SESSIONS = openF1SessionResults as {
  practice: Record<number, GrandPrixPracticeData>;
  qualifying: Record<number, GrandPrixQualifyingData>;
};

const WEEKEND_STANDARD_CHRONO: readonly ResultSessionKey[] = [
  "fp1",
  "fp2",
  "fp3",
  "qualifying",
  "race",
];

const WEEKEND_SPRINT_CHRONO: readonly ResultSessionKey[] = [
  "fp1",
  "sprintQualifying",
  "sprint",
  "qualifying",
  "race",
];

const DRIVER_ID_BY_CODE_OR_NAME = (() => {
  const map = new Map<string, string>();
  for (const driver of Object.values(DRIVERS_DATA)) {
    if (driver.code) map.set(driver.code.toUpperCase(), driver.id);
    map.set(driver.name.toLowerCase(), driver.id);
  }
  return map;
})();

function resolveDriverIdFromRow(row: ClassificationRow): string | null {
  if (
    row.driverId &&
    row.driverId !== "unknown" &&
    DRIVERS_DATA[row.driverId]
  ) {
    return row.driverId;
  }
  if (row.driverCode) {
    const byCode = DRIVER_ID_BY_CODE_OR_NAME.get(row.driverCode.toUpperCase());
    if (byCode) return byCode;
  }
  const byName = DRIVER_ID_BY_CODE_OR_NAME.get(row.driverName.toLowerCase());
  if (byName) return byName;
  if (row.driverId && row.driverId !== "unknown") return row.driverId;
  return null;
}

function getSessionLabel(
  key: ResultSessionKey,
  isVi: boolean,
): { readonly short: string; readonly full: string } {
  switch (key) {
    case "fp1":
      return { short: "FP1", full: isVi ? "Luyện tập 1" : "Practice 1" };
    case "fp2":
      return { short: "FP2", full: isVi ? "Luyện tập 2" : "Practice 2" };
    case "fp3":
      return { short: "FP3", full: isVi ? "Luyện tập 3" : "Practice 3" };
    case "sprintQualifying":
      return {
        short: "SQ",
        full: isVi ? "Phân hạng Sprint" : "Sprint Quali",
      };
    case "sprint":
      return { short: "SPRINT", full: isVi ? "Đua Sprint" : "Sprint Race" };
    case "qualifying":
      return { short: "QUALI", full: isVi ? "Phân hạng" : "Qualifying" };
    case "race":
      return { short: "RACE", full: isVi ? "Đua chính" : "Grand Prix" };
  }
}

function shortGpName(name: string): string {
  return name.replace(/\s+Grand Prix$/i, "").trim();
}

function shortTeamLabel(teamName: string): string {
  const id = resolveTeamId(teamName);
  if (id && TEAMS_DATA[id]) {
    return TEAMS_DATA[id].name;
  }
  return teamName;
}

interface SeasonPillBarProps {
  readonly season: SeasonYear;
  readonly lang: "vi" | "en";
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly summaryText: string;
}

export const SeasonPillBar = memo(function SeasonPillBar({
  season,
  lang,
  onSelectSeason,
  summaryText,
}: SeasonPillBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pill = useSlidingGlassPill(barRef, season, ".sp-lg-ybtn.is-active");
  return (
    <div
      ref={barRef}
      className={`sp-lg-panel sp-lg-years sp-lg-segmented ${pill.ready ? "has-slider" : ""}`}
      role="group"
      aria-label={lang === "vi" ? "Chọn mùa giải" : "Select season"}
    >
      {pill.ready && (
        <span
          className="sp-lg-pill-slider"
          aria-hidden="true"
          style={{
            transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
            width: `${pill.width}px`,
            height: `${pill.height}px`,
          }}
        />
      )}
      {SEASONS.map((year) => {
        const active = season === year;
        return (
          <button
            key={year}
            type="button"
            className={`sp-lg-ybtn ${active ? "is-active" : ""}`}
            aria-pressed={active}
            onClick={() => onSelectSeason?.(year)}
          >
            {year}
          </button>
        );
      })}
      <span className="sp-lg-ychamp">{summaryText}</span>
    </div>
  );
});

/* ============================================================================
   1. STORM RESULTS VIEW (Interactive Dossier Rows — REQ-05 / AC-02.3)
   ============================================================================ */

export interface StormResultsViewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly calendar: readonly GrandPrixRound[];
  readonly results: readonly RaceResult[];
  readonly selectedRound: number;
  readonly reducedMotion?: boolean;
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly onSelectRound: (round: number) => void;
  readonly onInspect: (target: StormInspectionTarget) => void;
}

export const StormResultsView = memo(function StormResultsView({
  lang,
  season,
  calendar,
  results,
  selectedRound,
  reducedMotion = false,
  onSelectSeason,
  onSelectRound,
  onInspect,
}: StormResultsViewProps) {
  const isVi = lang === "vi";
  const [selectedSession, setSelectedSession] =
    useState<ResultSessionKey>("race");

  const activeRoundItem = useMemo(
    () =>
      calendar.find((r) => r.round === selectedRound) ??
      calendar.find((r) => r.round === results[results.length - 1]?.round) ??
      calendar[0],
    [calendar, results, selectedRound],
  );

  const detailedPool = useMemo(
    () =>
      season === 2026
        ? DETAILED_RACE_RESULTS_2026
        : season === 2024
          ? DETAILED_RACE_RESULTS_2024
          : [],
    [season],
  );

  const sources: ResultDataSources = useMemo(
    () => ({
      season,
      calendar,
      detailedResults: detailedPool,
      raceSummaries: results,
      practice: season === 2026 ? OPEN_2026_SESSIONS.practice : EMPTY_PRACTICE,
      qualifying:
        season === 2026 ? OPEN_2026_SESSIONS.qualifying : EMPTY_QUALIFYING,
    }),
    [calendar, detailedPool, results, season],
  );

  const roundNum = activeRoundItem?.round ?? 1;

  const weekendSessions = useMemo(
    () =>
      activeRoundItem?.hasSprint
        ? WEEKEND_SPRINT_CHRONO
        : WEEKEND_STANDARD_CHRONO,
    [activeRoundItem?.hasSprint],
  );

  const availableSessions = useMemo(
    () => getAvailableSessions(sources, roundNum),
    [roundNum, sources],
  );

  const resolvedSession: ResultSessionKey = useMemo(() => {
    if (
      weekendSessions.includes(selectedSession) &&
      availableSessions.includes(selectedSession)
    ) {
      return selectedSession;
    }
    if (availableSessions.includes("race")) return "race";
    return availableSessions[0] ?? "race";
  }, [availableSessions, selectedSession, weekendSessions]);

  const activeRaceClassification = useMemo(
    () =>
      resolvedSession === "race" && activeRoundItem
        ? getCompleteRaceClassification(season, roundNum, detailedPool)
        : null,
    [activeRoundItem, detailedPool, resolvedSession, roundNum, season],
  );

  const activeSessionClassification = useMemo(() => {
    if (resolvedSession === "race" && activeRaceClassification) {
      const rows: ClassificationRow[] = activeRaceClassification.entries.map(
        (entry) => ({
          position: entry.position,
          driverId: entry.driverId,
          driverNumber: entry.driverNumber,
          driverCode: entry.driverCode,
          driverName: entry.driverName,
          teamId: entry.teamId,
          teamName: entry.teamName,
          bestLap: entry.timeOrGap,
          laps: entry.laps,
          grid: entry.gridPosition,
          points: entry.points,
          fastestLap: entry.fastestLap
            ? entry.fastestLapTime || "Fastest lap"
            : undefined,
          status: entry.status === "Finished" ? undefined : entry.status,
        }),
      );
      return {
        session: "race" as const,
        status:
          activeRaceClassification.status === "live"
            ? ("provisional" as const)
            : ("final" as const),
        rows,
        source:
          activeRaceClassification.dataSource || "PEDS Official Classification",
        partial: Boolean(activeRaceClassification.isSynthesized),
      };
    }
    return getSessionClassification(sources, roundNum, resolvedSession);
  }, [activeRaceClassification, resolvedSession, roundNum, sources]);

  const resultByRound = useMemo(
    () => new Map(results.map((r) => [r.round, r] as const)),
    [results],
  );

  const activeSummary = activeRoundItem
    ? resultByRound.get(activeRoundItem.round)
    : undefined;
  const isPendingRound = !activeSessionClassification && !activeSummary;
  const gpShort = shortGpName(
    activeRoundItem?.name ?? activeSummary?.grandPrix ?? "Grand Prix",
  );
  const resolvedLabel = getSessionLabel(resolvedSession, isVi);
  const isPractice =
    resolvedSession === "fp1" ||
    resolvedSession === "fp2" ||
    resolvedSession === "fp3";
  const isQualifying =
    resolvedSession === "qualifying" || resolvedSession === "sprintQualifying";
  const wrapRef = useRef<HTMLDivElement>(null);
  const compactSeasonRef = useRef<HTMLDivElement>(null);
  const sessionTabsRef = useRef<HTMLDivElement>(null);
  const roundsBarRef = useRef<HTMLElement>(null);
  const seasonPill = useSlidingGlassPill(
    compactSeasonRef,
    season,
    ".sp-lg-ybtn.is-active",
  );
  const sessionPill = useSlidingGlassPill(
    sessionTabsRef,
    `${season}:${roundNum}:${resolvedSession}`,
    ".sp-lg-sbtn.is-active",
  );
  useLiquidPointerGlow(wrapRef, reducedMotion);

  useEffect(() => {
    const bar = roundsBarRef.current;
    if (!bar) return;
    const activeBtn = bar.querySelector<HTMLElement>(".sp-lg-rbtn.is-active");
    if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
      activeBtn.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    }
  }, [activeRoundItem?.round, reducedMotion, season]);

  return (
    <div ref={wrapRef} className="sp-lg-wrap" data-prototype-tab="results">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-pagehead-top">
          <div>
            <div className="sp-lg-kick">
              {isVi
                ? `KẾT QUẢ · CHẶNG ${roundNum} · ${resolvedLabel.short} · ${isPendingRound ? "SẮP DIỄN RA" : "PHÂN HẠNG ĐẦY ĐỦ"}`
                : `RESULTS · ROUND ${roundNum} · ${resolvedLabel.short} · ${isPendingRound ? "UPCOMING" : "FULL CLASSIFICATION"}`}
            </div>
            <h1 className="sp-lg-h1">
              {gpShort},{" "}
              <em>
                {isPendingRound
                  ? isVi
                    ? "chưa diễn ra."
                    : "not yet run."
                  : isVi
                    ? "đã phân hạng."
                    : "classified."}
              </em>
            </h1>
          </div>

          <div
            ref={compactSeasonRef}
            className={`sp-lg-panel sp-lg-season-compact sp-lg-segmented ${seasonPill.ready ? "has-slider" : ""}`}
            role="group"
            aria-label={isVi ? "Mùa giải" : "Season"}
          >
            {seasonPill.ready && (
              <span
                className="sp-lg-pill-slider"
                aria-hidden="true"
                style={{
                  transform: `translate3d(${seasonPill.left}px, ${seasonPill.top}px, 0)`,
                  width: `${seasonPill.width}px`,
                  height: `${seasonPill.height}px`,
                }}
              />
            )}
            {SEASONS.map((year) => (
              <button
                key={year}
                type="button"
                className={`sp-lg-ybtn ${season === year ? "is-active" : ""}`}
                aria-pressed={season === year}
                onClick={() => onSelectSeason?.(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav
        ref={roundsBarRef}
        className="sp-lg-panel sp-lg-rounds"
        aria-label={isVi ? "Chọn chặng đua" : "Choose a round"}
      >
        {calendar.map((round) => {
          const isActive = round.round === activeRoundItem?.round;
          const isSoon = !resultByRound.has(round.round);
          return (
            <button
              key={round.round}
              type="button"
              className={`sp-lg-rbtn ${isActive ? "is-active" : ""} ${isSoon ? "is-soon" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelectRound(round.round)}
            >
              <span className="sp-lg-rn">
                {isVi ? `CHẶNG ${round.round}` : `ROUND ${round.round}`}
              </span>
              <span className="sp-lg-rg">{shortGpName(round.name)}</span>
            </button>
          );
        })}
      </nav>

      <section
        className="sp-lg-panel sp-lg-results-panel"
        data-lg-glow="true"
        aria-label={
          isVi ? "Bảng phân hạng theo phiên" : "Session classification"
        }
      >
        <div className="sp-lg-panel-head">
          <h2>
            {resolvedLabel.full.toUpperCase()} ·{" "}
            <b>
              {gpShort.toUpperCase()} GP {season}
            </b>
            {activeSessionClassification
              ? ` · ${activeSessionClassification.rows.length} ${isVi ? "TAY ĐUA" : "DRIVERS"}`
              : ""}
          </h2>
          {activeRoundItem?.hasSprint && (
            <span className="sp-lg-sprint-badge">
              {isVi ? "CUỐI TUẦN SPRINT" : "SPRINT WEEKEND"}
            </span>
          )}
        </div>

        <div
          ref={sessionTabsRef}
          className={`sp-lg-session-tabs sp-lg-segmented ${sessionPill.ready ? "has-slider" : ""}`}
          role="tablist"
          aria-label={
            isVi ? "Chọn phiên từ Practice tới Sprint/Race" : "Weekend sessions"
          }
        >
          {sessionPill.ready && (
            <span
              className="sp-lg-pill-slider is-session"
              aria-hidden="true"
              style={{
                transform: `translate3d(${sessionPill.left}px, ${sessionPill.top}px, 0)`,
                width: `${sessionPill.width}px`,
                height: `${sessionPill.height}px`,
              }}
            />
          )}
          {weekendSessions.map((sessionKey) => {
            const label = getSessionLabel(sessionKey, isVi);
            const hasData = availableSessions.includes(sessionKey);
            const isSelected = resolvedSession === sessionKey;
            return (
              <button
                key={sessionKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                disabled={!hasData}
                className={`sp-lg-sbtn ${isSelected ? "is-active" : ""} ${!hasData ? "is-unavailable" : ""}`}
                onClick={() => setSelectedSession(sessionKey)}
              >
                <span className="sp-lg-sbtn-short">{label.short}</span>
                <span className="sp-lg-sbtn-full">{label.full}</span>
              </button>
            );
          })}
        </div>

        {activeSessionClassification ? (
          <div
            key={`${season}:${roundNum}:${resolvedSession}`}
            className="sp-lg-rows-group"
          >
            {activeSessionClassification.rows.map((row, rowIdx) => {
              const isWin = row.position === 1;
              const code =
                row.driverCode ?? row.driverName.slice(0, 3).toUpperCase();
              const driverId = resolveDriverIdFromRow(row);
              const tagLabel = isPractice
                ? row.laps
                  ? `${row.laps} ${isVi ? "VÒNG" : "LAPS"}`
                  : ""
                : isQualifying
                  ? row.q3
                    ? "Q3"
                    : row.q2
                      ? "Q2"
                      : row.q1
                        ? "Q1"
                        : ""
                  : isWin
                    ? isVi
                      ? "NHẤT CHẶNG"
                      : "WINNER"
                    : row.fastestLap
                      ? isVi
                        ? "VÒNG NHANH NHẤT"
                        : "FASTEST LAP"
                      : row.position <= 3
                        ? "PODIUM"
                        : row.status
                          ? row.status.toUpperCase()
                          : "";
              const middleTime = isPractice
                ? row.gap && row.position > 1
                  ? `${row.bestLap ?? "—"} · ${row.gap}`
                  : (row.bestLap ?? "—")
                : isQualifying
                  ? [
                      row.q1 ? `Q1 ${row.q1}` : null,
                      row.q2 ? `Q2 ${row.q2}` : null,
                      row.q3 ? `Q3 ${row.q3}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") ||
                    row.bestLap ||
                    row.gap ||
                    "—"
                  : (row.bestLap ?? row.gap ?? "—");
              const rightMetric = isPractice
                ? {
                    val: row.position === 1 ? "P1" : (row.gap ?? "—"),
                    unit: "",
                  }
                : isQualifying
                  ? {
                      val: row.bestLap ?? row.gap ?? "—",
                      unit: row.laps ? `${row.laps}L` : "",
                    }
                  : {
                      val: String(row.points ?? 0),
                      unit: "PTS",
                    };

              return (
                <button
                  key={`${resolvedSession}-${row.position}-${code}-${row.driverName}`}
                  type="button"
                  data-driver-inspect="true"
                  className={`sp-lg-rrow sp-lg-rrow--interactive ${isWin ? "is-win" : ""}`}
                  style={{ animationDelay: `${Math.min(rowIdx * 22, 260)}ms` }}
                  onClick={() => {
                    if (driverId) {
                      onInspect({ kind: "driver", driverId, season });
                    } else if (row.teamId) {
                      onInspect({ kind: "team", teamId: row.teamId, season });
                    }
                  }}
                >
                  <span className="sp-lg-rpos">
                    {String(row.position).padStart(2, "0")}
                  </span>
                  <span className="sp-lg-rcode">{code}</span>
                  <span className="sp-lg-rwho">
                    {row.driverName}
                    <small>{shortTeamLabel(row.teamName)}</small>
                  </span>
                  {tagLabel ? (
                    <span className="sp-lg-rtag">{tagLabel}</span>
                  ) : (
                    <span />
                  )}
                  <span className="sp-lg-rgap">{middleTime}</span>
                  <span className="sp-lg-rpts">
                    {rightMetric.val}
                    {rightMetric.unit ? (
                      <small>{rightMetric.unit}</small>
                    ) : null}
                  </span>
                </button>
              );
            })}

            {activeSessionClassification.partial && (
              <div className="sp-lg-pending">
                {isVi
                  ? "Đã xác nhận top 3 bục Podium chính thức. Dữ liệu đầy đủ cả 20 tay đua chưa được đồng bộ chi tiết cho chặng này."
                  : "Official P1–P3 podium verified above. Full 20-car detailed classification has not been synced yet for this round."}
              </div>
            )}
          </div>
        ) : (
          <div className="sp-lg-pending">
            <b>{activeRoundItem?.name ?? "Grand Prix"}</b> ·{" "}
            {isVi
              ? `chặng đua chưa diễn ra (${activeRoundItem?.dates ?? ""}). Bảng phân hạng sẽ được cập nhật sau khi kết thúc cuộc đua.`
              : `this race has not been run yet (${activeRoundItem?.dates ?? ""}). Final classification will appear after the chequered flag.`}
          </div>
        )}
      </section>

      <div className="sp-lg-notes">
        <div className="sp-lg-panel sp-lg-note" data-lg-glow="true">
          <div className="sp-lg-note-k">
            {isVi ? "CHIẾN THẮNG CHẶNG" : "RACE WINNER"}
          </div>
          <p>
            {activeSummary ? (
              <>
                <b>{activeSummary.podium.p1.driver}</b> (
                {shortTeamLabel(activeSummary.podium.p1.team)}) ·{" "}
                {activeSummary.podium.p1.time} · {activeSummary.date}
              </>
            ) : (
              <>
                <b>{activeRoundItem?.circuit}</b> · {activeRoundItem?.laps ?? 0}{" "}
                {isVi ? "vòng" : "laps"} · {activeRoundItem?.dates}
              </>
            )}
          </p>
        </div>
        <div className="sp-lg-panel sp-lg-note" data-lg-glow="true">
          <div className="sp-lg-note-k">
            {activeSummary?.fastestLap
              ? isVi
                ? "VÒNG NHANH NHẤT"
                : "FASTEST LAP"
              : isVi
                ? "THÔNG SỐ ĐƯỜNG ĐUA"
                : "CIRCUIT TELEMETRY"}
          </div>
          <p>
            {activeSummary?.fastestLap ? (
              <>
                <b>{activeSummary.fastestLap.driver}</b> (
                {shortTeamLabel(activeSummary.fastestLap.team)}) ·{" "}
                {activeSummary.fastestLap.time}
              </>
            ) : (
              <>
                <b>
                  {activeRoundItem?.location}, {activeRoundItem?.country}
                </b>{" "}
                · {activeRoundItem?.circuitLengthKm ?? 0} km /{" "}
                {isVi ? "vòng" : "lap"}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="sp-lg-foot">
        {isVi
          ? `PHÂN HẠNG CHÍNH THỨC MÙA ${season} · NHẤP DÒNG BẤT KỲ ĐỂ MỞ HỒ SƠ TAY ĐUA`
          : `OFFICIAL CLASSIFICATION · SEASON ${season} · SELECT ANY ROW TO OPEN DOSSIER`}
      </div>
    </div>
  );
});

/* ============================================================================
   2. STORM CALENDAR VIEW (Auto IP Timezone + Leaf Countdown — REQ-04 / REQ-13)
   ============================================================================ */

interface CalendarRoundTileProps {
  readonly season: SeasonYear;
  readonly round: GrandPrixRound;
  readonly roundIdx: number;
  readonly isVi: boolean;
  readonly isNext: boolean;
  readonly isSelected: boolean;
  readonly winner?: RaceResult;
  readonly onSelectRound: (round: number) => void;
}

const CalendarRoundTile = memo(function CalendarRoundTile({
  season,
  round,
  roundIdx,
  isVi,
  isNext,
  isSelected,
  winner,
  onSelectRound,
}: CalendarRoundTileProps) {
  return (
    <button
      key={`${season}-${round.round}`}
      type="button"
      data-lg-glow="true"
      data-lg-reveal="true"
      style={{ animationDelay: `${Math.min(roundIdx * 24, 320)}ms` }}
      className={`sp-lg-panel sp-lg-tile ${isNext ? "is-next" : ""} ${isSelected ? "is-selected" : ""}`}
      onClick={() => onSelectRound(round.round)}
    >
      <div className="sp-lg-tile-head">
        <span className="sp-lg-tile-tr">
          {isVi ? "VÒNG" : "ROUND"} {String(round.round).padStart(2, "0")}
        </span>
        {isNext ? (
          <span className="sp-lg-tile-badge is-next">
            {isVi ? "CHẶNG TIẾP THEO" : "NEXT RACE"}
          </span>
        ) : winner ? (
          <span className="sp-lg-tile-badge is-done">
            {isVi ? "ĐÃ ĐUA" : "DONE"}
          </span>
        ) : (
          <span className="sp-lg-tile-badge">
            {isVi ? "SẮP TỚI" : "UPCOMING"}
          </span>
        )}
      </div>
      <h3>{shortGpName(round.name)}</h3>
      <div className="sp-lg-tile-tc">
        {round.circuit} · {round.location}
      </div>
      <div className={`sp-lg-tile-tstat ${isNext ? "is-next" : ""}`}>
        {isNext ? (
          <>
            {isVi ? "KẾ TIẾP" : "NEXT UP"} · <b>{round.dates.toUpperCase()}</b>{" "}
            · {round.laps} {isVi ? "VÒNG" : "LAPS"}
          </>
        ) : winner ? (
          <>
            {isVi ? "NHẤT CHẶNG" : "WINNER"} ·{" "}
            <b>
              {winner.podium.p1.driver} ·{" "}
              {shortTeamLabel(winner.podium.p1.team)}
            </b>
          </>
        ) : round.status === "upcoming" ? (
          <>
            {isVi ? "SẮP DIỄN RA" : "UPCOMING"} · {round.dates.toUpperCase()}
          </>
        ) : (
          <>{isVi ? "ĐÃ HOÀN THÀNH" : "SEASON COMPLETE"}</>
        )}
      </div>
    </button>
  );
});

export interface StormCalendarViewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly calendar: readonly GrandPrixRound[];
  readonly results: readonly RaceResult[];
  readonly standingsDrivers: readonly DriverStanding[];
  readonly nextRace?: GrandPrixRound;
  readonly selectedRound: number;
  readonly reducedMotion: boolean;
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly onSelectRound: (round: number) => void;
}

export const StormCalendarView = memo(function StormCalendarView({
  lang,
  season,
  calendar,
  results,
  standingsDrivers,
  nextRace,
  selectedRound,
  reducedMotion,
  onSelectSeason,
  onSelectRound,
}: StormCalendarViewProps) {
  const isVi = lang === "vi";
  const timeZone = useTimezoneStore((s) => s.timeZone);
  const resolvedTz = effectiveTimeZone(timeZone);

  const leader = standingsDrivers[0];
  const winnerByRound = useMemo(
    () => new Map(results.map((r) => [r.round, r] as const)),
    [results],
  );

  const spotlightRound = useMemo(() => {
    if (season === 2026) {
      return (
        calendar.find(
          (r) => r.round === selectedRound && !winnerByRound.has(r.round),
        ) ??
        nextRace ??
        calendar.find((r) => r.round === selectedRound) ??
        calendar[calendar.length - 1]
      );
    }
    return calendar[0];
  }, [calendar, nextRace, season, selectedRound, winnerByRound]);

  const raceStartDate = useMemo(() => {
    if (!spotlightRound) return null;
    return getSessionTimeRange(spotlightRound, "race")?.start ?? null;
  }, [spotlightRound]);

  const tzOffsetSummary = useMemo(
    () =>
      `${resolvedTz} (${zoneOffsetLabel(raceStartDate ?? new Date(), resolvedTz)})`,
    [raceStartDate, resolvedTz],
  );

  const sessionRows = useMemo(() => {
    if (!spotlightRound) return [];
    const entries: { key: string; label: string; timeText: string }[] = [];
    const add = (
      sessionKey: keyof GrandPrixRound["sessions"],
      label: string,
    ) => {
      const s = spotlightRound.sessions[sessionKey];
      if (!s) return;
      const zoned = formatRaceSessionTime(
        spotlightRound,
        sessionKey,
        resolvedTz,
        lang,
      );
      entries.push({
        key: sessionKey,
        label,
        timeText: zoned ?? `${s.dateStr} · ${s.timeStr}`,
      });
    };

    add("fp1", isVi ? "Luyện tập 1 (FP1)" : "FREE PRACTICE 1");
    add("fp2", isVi ? "Luyện tập 2 (FP2)" : "FREE PRACTICE 2");
    add("fp3", isVi ? "Luyện tập 3 (FP3)" : "FREE PRACTICE 3");
    add("sprintQualifying", "SPRINT QUALIFYING");
    add("sprint", "SPRINT RACE");
    add("qualifying", isVi ? "Phân hạng" : "QUALIFYING");
    add("race", isVi ? "Đua chính (Lights out)" : "RACE · LIGHTS OUT");
    return entries;
  }, [isVi, lang, resolvedTz, spotlightRound]);

  const championSummary = leader
    ? `${season === 2026 ? (isVi ? "DẪN ĐẦU" : "LEADER") : isVi ? "VÔ ĐỊCH" : "CHAMPION"} · ${leader.driverName.toUpperCase()} · ${shortTeamLabel(leader.teamName).toUpperCase()}`
    : `${calendar.length} ROUNDS`;
  const calWrapRef = useRef<HTMLDivElement>(null);
  useLiquidPointerGlow(calWrapRef, reducedMotion);
  useViewportReveal(calWrapRef, reducedMotion, season);

  return (
    <div ref={calWrapRef} className="sp-lg-wrap" data-prototype-tab="calendar">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-kick">
          {isVi
            ? `LỊCH THI ĐẤU · MÙA GIẢI ${season} · ${calendar.length} CHẶNG`
            : `CALENDAR · SEASON ${season} · ${calendar.length} ROUNDS`}
        </div>
        <h1 className="sp-lg-h1">
          {isVi ? "Mùa giải," : "The season,"}{" "}
          <em>{isVi ? "lịch trình." : "mapped."}</em>
        </h1>
      </header>

      <SeasonPillBar
        season={season}
        lang={lang}
        onSelectSeason={onSelectSeason}
        summaryText={championSummary}
      />

      <section
        className="sp-lg-panel sp-lg-nextpanel"
        data-lg-glow="true"
        aria-label={isVi ? "Chi tiết chặng tiêu điểm" : "Race schedule details"}
      >
        {season === 2026 && spotlightRound ? (
          <>
            <div className="sp-lg-np-head">
              <div>
                <div className="sp-lg-np-k">
                  {nextRace?.round === spotlightRound.round ? (
                    <span className="sp-lg-live-dot" aria-hidden="true" />
                  ) : null}
                  {nextRace?.round === spotlightRound.round
                    ? isVi
                      ? `CHẶNG TIẾP THEO · VÒNG ${spotlightRound.round}`
                      : `NEXT RACE · ROUND ${spotlightRound.round}`
                    : isVi
                      ? `CHẶNG ĐANG CHỌN · VÒNG ${spotlightRound.round}`
                      : `SELECTED · ROUND ${spotlightRound.round}`}
                </div>
                <div className="sp-lg-np-title">
                  {shortGpName(spotlightRound.name)} <em>Grand Prix</em>
                </div>
                <div className="sp-lg-np-sub">
                  {spotlightRound.circuit.toUpperCase()}
                </div>
                <AutoTimezoneBadge
                  lang={lang}
                  timeZone={resolvedTz}
                  referenceDate={raceStartDate ?? undefined}
                  variant="calendar"
                  className="sp-cal-tz-badge"
                />
              </div>
              <div className="sp-lg-cd">
                <div className="sp-lg-cd-v">
                  <LiveCountdownLeaf
                    targetEpochMs={
                      raceStartDate ? raceStartDate.getTime() : null
                    }
                    lang={lang}
                    reducedMotion={reducedMotion}
                  />
                </div>
                <div className="sp-lg-cd-l">
                  {isVi ? "ĐẾM NGƯỢC TỚI LIGHTS OUT" : "UNTIL LIGHTS OUT"}
                </div>
              </div>
            </div>

            <div className="sp-lg-sessions">
              {sessionRows.map((row) => (
                <div key={row.key} className="sp-lg-srow2">
                  <span className="sp-lg-sn">{row.label}</span>
                  <time>{row.timeText}</time>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="sp-lg-np-head">
              <div>
                <div className="sp-lg-np-k">
                  {isVi ? "LƯU TRỮ MÙA GIẢI" : "SEASON ARCHIVE"}
                </div>
                <div className="sp-lg-np-title">
                  {isVi ? "Mùa giải" : "Season"} <em>{season}</em>
                </div>
                <div className="sp-lg-np-sub">
                  {calendar.length} ROUNDS · {championSummary}
                </div>
              </div>
            </div>
            <div className="sp-lg-np-note">
              {isVi
                ? `Toàn bộ ${calendar.length} chặng đua mùa ${season} theo đúng thứ tự chính thức được liệt kê bên dưới. Giờ phiên chi tiết theo múi giờ tự động được xuất bản trực tiếp cho mùa 2026.`
                : `The full ${season} calendar lists every official venue in race order below. Live session-by-session automatic timezone schedules are published for the 2026 season.`}
            </div>
          </>
        )}
      </section>

      <section
        className="sp-lg-tiles"
        aria-label={isVi ? "Danh sách chặng đua" : "Season rounds grid"}
      >
        {calendar.map((round, roundIdx) => (
          <CalendarRoundTile
            key={`${season}-${round.round}`}
            season={season}
            round={round}
            roundIdx={roundIdx}
            isVi={isVi}
            isNext={season === 2026 && nextRace?.round === round.round}
            isSelected={round.round === selectedRound}
            winner={winnerByRound.get(round.round)}
            onSelectRound={onSelectRound}
          />
        ))}
      </section>

      <div className="sp-lg-foot">
        {isVi
          ? `LỊCH THI ĐẤU CHÍNH THỨC MÙA ${season} · MÚI GIỜ TỰ ĐỘNG ${tzOffsetSummary}`
          : `OFFICIAL CALENDAR · SEASON ${season} · AUTO TIMEZONE ${tzOffsetSummary}`}
      </div>
    </div>
  );
});

/* ============================================================================
   3. STORM STANDINGS VIEW
   ============================================================================ */

export interface StormStandingsViewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly drivers: readonly DriverStanding[];
  readonly constructors: readonly ConstructorStanding[];
  readonly hoveredStandingsId: string | null;
  readonly reducedMotion?: boolean;
  readonly onHoverStandingsId: (id: string | null) => void;
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly onInspect: (target: StormInspectionTarget) => void;
}

export const StormStandingsView = memo(function StormStandingsView({
  lang,
  season,
  drivers,
  constructors,
  hoveredStandingsId,
  reducedMotion = false,
  onHoverStandingsId,
  onSelectSeason,
  onInspect,
}: StormStandingsViewProps) {
  const isVi = lang === "vi";
  const topDriver = drivers[0];
  const topConstructor = constructors[0];
  const maxDriverPts = Math.max(1, topDriver?.points ?? 1);
  const maxTeamPts = Math.max(1, topConstructor?.points ?? 1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const animatedLeaderPts = useKineticNumber(
    topDriver?.points ?? 0,
    reducedMotion,
    560,
  );
  useLiquidPointerGlow(wrapRef, reducedMotion);

  return (
    <div ref={wrapRef} className="sp-lg-wrap" data-prototype-tab="standings">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-kick">
          {isVi
            ? `BẢNG XẾP HẠNG · MÙA GIẢI ${season}`
            : `STANDINGS · SEASON ${season}`}
        </div>
        <h1 className="sp-lg-h1">
          {isVi ? "Mùa giải," : "The season,"}{" "}
          <em>{isVi ? "toàn bảng." : "ranked."}</em>
        </h1>
      </header>

      <SeasonPillBar
        season={season}
        lang={lang}
        onSelectSeason={onSelectSeason}
        summaryText={
          topDriver
            ? `${season === 2026 ? (isVi ? "DẪN ĐẦU" : "LEADER") : isVi ? "VÔ ĐỊCH" : "CHAMPION"} · ${topDriver.driverName.toUpperCase()} (${topDriver.points} PTS)`
            : `${isVi ? "MÙA GIẢI" : "SEASON"} ${season}`
        }
      />

      {topDriver && (
        <section
          className="sp-lg-panel sp-lg-spot"
          data-lg-glow="true"
          aria-label={isVi ? "Người dẫn đầu bảng điểm" : "Championship leader"}
        >
          <div>
            <div className="sp-lg-spot-k">
              {season === 2026
                ? isVi
                  ? "DẪN ĐẦU MÙA GIẢI 2026"
                  : "2026 CHAMPIONSHIP LEADER"
                : isVi
                  ? `NHÀ VÔ ĐỊCH THẾ GIỚI ${season}`
                  : `${season} WORLD CHAMPION`}
            </div>
            <div className="sp-lg-spot-nm">
              {topDriver.driverName.split(" ").slice(0, -1).join(" ")}{" "}
              <em>{topDriver.driverName.split(" ").slice(-1)[0]}</em>
            </div>
            <div className="sp-lg-spot-sub">
              {topDriver.teamName.toUpperCase()} · {topDriver.wins}{" "}
              {isVi ? "CHIẾN THẮNG" : "WINS"} · {topDriver.podiums}{" "}
              {isVi ? "PODIUM" : "PODIUMS"}
            </div>
          </div>
          <div className="sp-lg-spot-r">
            <b>{animatedLeaderPts}</b>
            <span>{isVi ? "ĐIỂM" : "POINTS"}</span>
          </div>
        </section>
      )}

      <div className="sp-lg-cols">
        <section
          className="sp-lg-panel sp-lg-standings-panel"
          data-lg-glow="true"
          aria-label={isVi ? "Bảng xếp hạng Tay đua" : "Drivers' Championship"}
        >
          <h2>{isVi ? "BẢNG XẾP HẠNG TAY ĐUA" : "DRIVERS’ CHAMPIONSHIP"}</h2>
          {drivers.map((d) => {
            const isChamp = d.rank === 1;
            const gap = topDriver ? d.points - topDriver.points : 0;
            const pct = Math.max(
              2,
              Math.round((d.points / maxDriverPts) * 100),
            );
            const barStyle = { "--w": `${pct}%` } as CSSProperties;
            return (
              <button
                key={d.driverId}
                type="button"
                className={`sp-lg-srow ${isChamp ? "is-champ" : ""} ${hoveredStandingsId === d.driverId ? "is-hovered" : ""}`}
                onMouseEnter={() => onHoverStandingsId(d.driverId)}
                onMouseLeave={() => onHoverStandingsId(null)}
                onClick={() =>
                  onInspect({ kind: "driver", driverId: d.driverId, season })
                }
              >
                <span className="sp-lg-spos">
                  {String(d.rank).padStart(2, "0")}
                </span>
                <span className="sp-lg-scode">{d.driverCode}</span>
                <span className="sp-lg-swho">
                  {d.driverName}
                  <small>{shortTeamLabel(d.teamName)}</small>
                </span>
                {isChamp ? (
                  <span className="sp-lg-sctag">
                    {season === 2026
                      ? isVi
                        ? "DẪN ĐẦU"
                        : "LEADER"
                      : isVi
                        ? `VÔ ĐỊCH ${season}`
                        : `${season} CHAMPION`}
                  </span>
                ) : (
                  <span className="sp-lg-sgap">{gap}</span>
                )}
                <span className="sp-lg-spts">
                  {d.points}
                  <small>PTS</small>
                </span>
                <span
                  className="sp-lg-strack"
                  style={barStyle}
                  aria-hidden="true"
                >
                  <span className="sp-lg-sbar">
                    <span className="sp-lg-sbar-fill" />
                  </span>
                  <span className="sp-lg-scar">
                    <MiniRaceCar
                      season={season}
                      teamId={d.teamId}
                      eager={d.rank <= 5}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </section>

        <section
          className="sp-lg-panel sp-lg-standings-panel"
          data-lg-glow="true"
          aria-label={
            isVi ? "Bảng xếp hạng Đội đua" : "Constructors' Championship"
          }
        >
          <h2>
            {isVi ? "BẢNG XẾP HẠNG ĐỘI ĐUA" : "CONSTRUCTORS’ CHAMPIONSHIP"}
          </h2>
          {constructors.map((c) => {
            const isChamp = c.rank === 1;
            const gap = topConstructor ? c.points - topConstructor.points : 0;
            const pct = Math.max(2, Math.round((c.points / maxTeamPts) * 100));
            const barStyle = { "--w": `${pct}%` } as CSSProperties;
            return (
              <button
                key={c.teamId}
                type="button"
                className={`sp-lg-srow is-team ${isChamp ? "is-champ" : ""} ${hoveredStandingsId === c.teamId ? "is-hovered" : ""}`}
                onMouseEnter={() => onHoverStandingsId(c.teamId)}
                onMouseLeave={() => onHoverStandingsId(null)}
                onClick={() =>
                  onInspect({ kind: "team", teamId: c.teamId, season })
                }
              >
                <span className="sp-lg-spos">
                  {String(c.rank).padStart(2, "0")}
                </span>
                <span className="sp-lg-swho">
                  {shortTeamLabel(c.teamName)}
                  <small>{c.engine}</small>
                </span>
                {isChamp ? (
                  <span className="sp-lg-sctag">
                    {season === 2026
                      ? isVi
                        ? "HẠNG 1"
                        : "P1 LEADER"
                      : isVi
                        ? "ĐƯƠNG KIM VÔ ĐỊCH"
                        : "CHAMPIONS"}
                  </span>
                ) : (
                  <span className="sp-lg-sgap">{gap}</span>
                )}
                <span className="sp-lg-spts">
                  {c.points}
                  <small>PTS</small>
                </span>
                <span
                  className="sp-lg-strack"
                  style={barStyle}
                  aria-hidden="true"
                >
                  <span className="sp-lg-sbar">
                    <span className="sp-lg-sbar-fill" />
                  </span>
                  <span className="sp-lg-scar">
                    <MiniRaceCar
                      season={season}
                      teamId={c.teamId}
                      eager={c.rank <= 5}
                    />
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      </div>

      <div className="sp-lg-foot">
        {isVi
          ? `ĐIỂM SỐ ĐÃ KIỂM CHỨNG · MÙA GIẢI ${season}`
          : `VERIFIED CHAMPIONSHIP POINTS · SEASON ${season}`}
      </div>
    </div>
  );
});

/* ============================================================================
   4. STORM TEAMS & DRIVERS DIRECTORIES (Clean Editorial Cards — BR-02)
   ============================================================================ */

export interface StormTeamsViewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly constructors: readonly ConstructorStanding[];
  readonly drivers: readonly DriverStanding[];
  readonly reducedMotion?: boolean;
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly onInspect: (target: StormInspectionTarget) => void;
}

export const StormTeamsView = memo(function StormTeamsView({
  lang,
  season,
  constructors,
  drivers,
  reducedMotion = false,
  onSelectSeason,
  onInspect,
}: StormTeamsViewProps) {
  const isVi = lang === "vi";
  const wrapRef = useRef<HTMLDivElement>(null);
  useLiquidPointerGlow(wrapRef, reducedMotion);
  useViewportReveal(wrapRef, reducedMotion, season);

  return (
    <div ref={wrapRef} className="sp-lg-wrap" data-prototype-tab="teams">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-kick">
          {isVi
            ? `ĐỘI ĐUA · MÙA GIẢI ${season} · ${constructors.length} ĐỘI`
            : `TEAMS · SEASON ${season} · ${constructors.length} TEAMS`}
        </div>
        <h1 className="sp-lg-h1">
          {isVi ? "Các đội đua," : "The garages,"}{" "}
          <em>{isVi ? "từng đội." : "team by team."}</em>
        </h1>
      </header>

      <SeasonPillBar
        season={season}
        lang={lang}
        onSelectSeason={onSelectSeason}
        summaryText={
          isVi
            ? `${constructors.length} ĐỘI · MÙA ${season}`
            : `${constructors.length} TEAMS · SEASON ${season}`
        }
      />

      <section
        className="sp-lg-tgrid"
        aria-label={isVi ? "Danh sách đội đua" : "Teams Directory"}
      >
        {constructors.map((entry, idx) => {
          const team = TEAMS_DATA[entry.teamId];
          if (!team) return null;
          const profile = getTeamSeasonProfile(entry.teamId, season);
          const seasonDrivers = drivers.filter(
            (d) => d.teamId === entry.teamId,
          );
          const accent = TEAM_TEXT_PALETTE[entry.teamId]?.dark ?? "#ff6a3d";
          const delayStyle = {
            animationDelay: `${Math.min(idx * 45, 700)}ms`,
            "--tc": accent,
          } as CSSProperties;

          return (
            <button
              key={entry.teamId}
              type="button"
              data-lg-glow="true"
              data-lg-reveal="true"
              className="sp-lg-panel sp-lg-tcard"
              style={delayStyle}
              onClick={() =>
                onInspect({ kind: "team", teamId: team.id, season })
              }
            >
              <div className="sp-lg-pslot">
                <StormVisualImage
                  kind="car"
                  season={season}
                  entityId={entry.teamId}
                  alt={`${entry.teamName} ${season} F1 car`}
                  className="sp-lg-team-car"
                  placeholder={`${season} · ${entry.teamName}`}
                />
              </div>

              <div className="sp-lg-ttop">
                <h3>{entry.teamName}</h3>
                <span className="sp-lg-tdot" aria-hidden="true" />
              </div>

              {profile?.fullName && profile.fullName !== entry.teamName ? (
                <div className="sp-lg-tfull">{profile.fullName}</div>
              ) : null}

              <div className="sp-lg-tbase">
                {(profile?.base ?? team.base).toUpperCase()}
              </div>

              <div className="sp-lg-tdrv">
                {seasonDrivers.map((d) => d.driverCode).join(" · ")}
              </div>

              {entry.rank === 1 && (
                <div className="sp-lg-tnote">
                  {season === 2026
                    ? isVi
                      ? "ĐANG DẪN ĐẦU BẢNG XẾP HẠNG ĐỘI ĐUA 2026"
                      : "2026 CONSTRUCTORS' STANDINGS LEADER"
                    : isVi
                      ? `VÔ ĐỊCH ĐỘI ĐUA MÙA ${season}`
                      : `${season} CONSTRUCTORS' CHAMPIONS`}
                </div>
              )}

              <div className="sp-lg-tstat">
                <span className="sp-lg-tpts">
                  <b>{entry.points}</b>
                  <small>PTS</small>
                </span>
                <span className="sp-lg-tpos">P{entry.rank}</span>
              </div>
            </button>
          );
        })}
      </section>

      <div className="sp-lg-foot">
        {isVi
          ? `HỆ THỐNG ĐỘI ĐUA CHÍNH THỨC ${season} · NHẤP THẺ ĐỂ XEM HỒ SƠ · HÌNH MINH HỌA BIÊN TẬP`
          : `OFFICIAL CONSTRUCTORS ${season} · SELECT ANY GARAGE TO INSPECT · ILLUSTRATIVE CONCEPT ART`}
      </div>
    </div>
  );
});

export interface StormDriversViewProps {
  readonly lang: "vi" | "en";
  readonly season: SeasonYear;
  readonly drivers: readonly DriverStanding[];
  readonly reducedMotion?: boolean;
  readonly onSelectSeason?: (season: SeasonYear) => void;
  readonly onInspect: (target: StormInspectionTarget) => void;
}

export const StormDriversView = memo(function StormDriversView({
  lang,
  season,
  drivers,
  reducedMotion = false,
  onSelectSeason,
  onInspect,
}: StormDriversViewProps) {
  const isVi = lang === "vi";
  const wrapRef = useRef<HTMLDivElement>(null);
  useLiquidPointerGlow(wrapRef, reducedMotion);
  useViewportReveal(wrapRef, reducedMotion, season);

  return (
    <div ref={wrapRef} className="sp-lg-wrap" data-prototype-tab="drivers">
      <header className="sp-lg-pagehead">
        <div className="sp-lg-kick">
          {isVi
            ? `TAY ĐUA · ĐỘI HÌNH ${season} · ${drivers.length} TAY ĐUA`
            : `DRIVERS · THE ${season} GRID · ${drivers.length} DRIVERS`}
        </div>
        <h1 className="sp-lg-h1">
          {isVi ? "Đội hình," : "The grid,"}{" "}
          <em>{isVi ? "từng tay đua." : "driver by driver."}</em>
        </h1>
      </header>

      <SeasonPillBar
        season={season}
        lang={lang}
        onSelectSeason={onSelectSeason}
        summaryText={
          isVi
            ? `${drivers.length} TAY ĐUA · MÙA ${season}`
            : `${drivers.length} DRIVERS · SEASON ${season}`
        }
      />

      <section
        className="sp-lg-dgrid"
        aria-label={isVi ? "Danh sách tay đua" : "Drivers"}
      >
        {drivers.map((row, idx) => {
          const driver = DRIVERS_DATA[row.driverId];
          const accent = TEAM_TEXT_PALETTE[row.teamId]?.dark ?? "#ff6a3d";
          const seasonNumber =
            getSeasonDriverNumber(season, row.driverId) ?? driver?.number;
          const displayNumber = seasonNumber ?? row.rank;
          const teamLabel = shortTeamLabel(row.teamName);
          const delayStyle = {
            animationDelay: `${Math.min(idx * 45, 700)}ms`,
            "--tc": accent,
          } as CSSProperties;

          return (
            <button
              key={`${season}:${row.driverId}`}
              type="button"
              data-lg-glow="true"
              data-lg-reveal="true"
              className="sp-lg-panel sp-lg-dcard"
              style={delayStyle}
              aria-label={`${row.driverName} · #${displayNumber} · ${row.driverCode} · ${teamLabel}`}
              onClick={() =>
                onInspect({ kind: "driver", driverId: row.driverId, season })
              }
            >
              <div className="sp-lg-dpslot">
                <StormVisualImage
                  kind="driver"
                  season={season}
                  entityId={row.driverId}
                  alt={`${row.driverName} ${season} portrait`}
                  className="sp-lg-driver-art"
                  placeholder={`#${displayNumber}`}
                />
              </div>

              <div className="sp-lg-dtop">
                <span className="sp-driver-depth-num" aria-hidden="true">
                  {displayNumber}
                </span>
                <span className="sp-lg-dcode">{row.driverCode}</span>
              </div>

              <h3>{row.driverName}</h3>
              <div className="sp-lg-dteam">{teamLabel.toUpperCase()}</div>
            </button>
          );
        })}
      </section>

      <div className="sp-lg-foot">
        {isVi
          ? `TAY ĐUA CHÍNH THỨC ${season} · NHẤP THẺ ĐỂ XEM HỒ SƠ · CHÂN DUNG MINH HỌA BIÊN TẬP`
          : `OFFICIAL DRIVERS ${season} · SELECT ANY DRIVER TO INSPECT · ILLUSTRATIVE PORTRAIT ART`}
      </div>
    </div>
  );
});
