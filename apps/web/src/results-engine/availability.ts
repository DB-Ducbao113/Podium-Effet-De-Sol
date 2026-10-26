import { UNKNOWN_TEAM_ID } from "../types";
import type {
  DetailedRaceResult,
  DetailedRaceResultEntry,
  GrandPrixRound,
  RaceResult,
  SeasonYear,
  TeamId,
} from "../types";
import type {
  GrandPrixPracticeData,
  PracticeSessionEntry,
} from "../types/practice";
import type {
  GrandPrixQualifyingData,
  QualifyingEntry,
} from "../types/qualifying";

export type ResultSessionKey =
  "race" | "qualifying" | "sprint" | "sprintQualifying" | "fp3" | "fp2" | "fp1";

export type ResultStatus = "awaiting" | "provisional" | "final" | "unavailable";

export interface ClassificationRow {
  position: number;
  driverId: string;
  driverNumber?: number;
  driverCode?: string;
  driverName: string;
  teamId: TeamId;
  teamName: string;
  bestLap?: string;
  gap?: string;
  laps?: number;
  q1?: string;
  q2?: string;
  q3?: string;
  grid?: number;
  points?: number;
  fastestLap?: string;
  compound?: string;
  status?: string;
}

export interface SessionClassification {
  session: ResultSessionKey;
  status: Exclude<ResultStatus, "awaiting" | "unavailable">;
  rows: ClassificationRow[];
  source: string;
  lastUpdated?: string;
  partial: boolean;
}

export interface ResultDataSources {
  season: SeasonYear;
  calendar: readonly GrandPrixRound[];
  detailedResults: readonly DetailedRaceResult[];
  raceSummaries: readonly RaceResult[];
  practice: Readonly<Record<number, GrandPrixPracticeData>>;
  qualifying: Readonly<Record<number, GrandPrixQualifyingData>>;
}

const STANDARD_ORDER: readonly ResultSessionKey[] = [
  "race",
  "qualifying",
  "fp3",
  "fp2",
  "fp1",
];
const SPRINT_ORDER: readonly ResultSessionKey[] = [
  "race",
  "qualifying",
  "sprint",
  "sprintQualifying",
  "fp1",
];

const validRows = (rows: readonly ClassificationRow[]): ClassificationRow[] => {
  const seen = new Set<string>();
  return rows
    .filter(
      (row) => {
        const key = row.driverId || row.driverName;
        const valid =
          Number.isInteger(row.position) &&
          row.position >= 0 &&
          row.driverName.trim().length > 0 &&
          !seen.has(key);
        if (valid) seen.add(key);
        return valid;
      },
    )
    .sort((a, b) =>
      a.position === 0
        ? 1
        : b.position === 0
          ? -1
          : a.position - b.position,
    );
};

const raceRows = (
  entries: readonly DetailedRaceResultEntry[],
): ClassificationRow[] =>
  validRows(
    entries.map((entry) => ({
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
    })),
  );

const summaryRows = (summary: RaceResult): ClassificationRow[] => {
  const podium = [
    { position: 1, value: summary.podium.p1, time: summary.podium.p1.time },
    { position: 2, value: summary.podium.p2, time: summary.podium.p2.gap },
    { position: 3, value: summary.podium.p3, time: summary.podium.p3.gap },
  ];
  return podium.map(({ position, value, time }) => ({
    position,
    driverId: "unknown",
    driverName: value.driver,
    teamId: UNKNOWN_TEAM_ID,
    teamName: value.team,
    bestLap: time,
    points: value.points,
    fastestLap:
      summary.fastestLap?.driver === value.driver
        ? summary.fastestLap.time
        : undefined,
  }));
};

const practiceRows = (
  entries: readonly PracticeSessionEntry[],
): ClassificationRow[] =>
  validRows(
    entries.map((entry) => ({
      position: entry.position,
      driverId: entry.driverId,
      driverNumber: entry.driverNumber,
      driverCode: entry.driverCode,
      driverName: entry.driverName,
      teamId: entry.teamId,
      teamName: entry.teamName,
      bestLap: entry.bestLapTime,
      gap: entry.gapToP1,
      laps: entry.lapsCompleted,
    })),
  );

const qualifyingRows = (
  entries: readonly QualifyingEntry[],
): ClassificationRow[] =>
  validRows(
    entries.map((entry) => ({
      position: entry.position,
      driverId: entry.driverId,
      driverNumber: entry.driverNumber,
      driverCode: entry.driverCode,
      driverName: entry.driverName,
      teamId: entry.teamId,
      teamName: entry.teamName,
      bestLap: entry.bestLapTime,
      gap: entry.gapToPole,
      laps: entry.lapsCompleted,
      q1: entry.q1Time,
      q2: entry.q2Time,
      q3: entry.q3Time,
      points: entry.sprintPoints,
      status: entry.status === "Finished" ? undefined : entry.status,
    })),
  );

export function getSessionClassification(
  sources: ResultDataSources,
  round: number,
  session: ResultSessionKey,
): SessionClassification | null {
  if (session === "race" || session === "sprint") {
    const race = sources.detailedResults.find((item) => item.round === round);
    const entries = session === "race" ? race?.entries : race?.sprintEntries;
    const rows = raceRows(entries ?? []);
    if (rows.length > 0) {
      return {
        session,
        status:
          race?.status === "live" ||
          (session === "sprint" && race?.sprintProvenance === "provisional")
            ? "provisional"
            : "final",
        rows,
        source: race?.dataSource || "Saved classification snapshot",
        lastUpdated: race?.dataUpdatedAt,
        partial: Boolean(race?.isSynthesized),
      };
    }
    if (session === "race") {
      const summary = sources.raceSummaries.find(
        (item) => item.round === round,
      );
      if (summary) {
        return {
          session,
          status: "final",
          rows: summaryRows(summary),
          source: summary.dataSource || "Saved race summary",
          lastUpdated: summary.dataUpdatedAt,
          partial: true,
        };
      }
    }
  }

  if (session === "fp1" || session === "fp2" || session === "fp3") {
    const result = sources.practice[round]?.sessions[session];
    const rows = practiceRows(result?.entries ?? []);
    if (rows.length > 0 && result) {
      return {
        session,
        status: result.status === "live" ? "provisional" : "final",
        rows,
        source: result.dataSource || "OpenF1 API /v1/session_result snapshot",
        lastUpdated: result.dateStr,
        partial: false,
      };
    }
  }

  if (
    session === "qualifying" ||
    session === "sprintQualifying" ||
    session === "sprint"
  ) {
    const result = sources.qualifying[round]?.sessions[session];
    const rows = qualifyingRows(result?.entries ?? []);
    if (rows.length > 0 && result) {
      return {
        session,
        status: result.status === "live" ? "provisional" : "final",
        rows,
        source: result.dataSource || "OpenF1 API /v1/session_result snapshot",
        lastUpdated: result.dateStr,
        partial: false,
      };
    }
  }

  return null;
}

export function getAvailableSessions(
  sources: ResultDataSources,
  round: number,
): ResultSessionKey[] {
  const weekend = sources.calendar.find((item) => item.round === round);
  if (!weekend) return [];
  const order = weekend.hasSprint ? SPRINT_ORDER : STANDARD_ORDER;
  return order.filter((session) =>
    Boolean(getSessionClassification(sources, round, session)),
  );
}

export function getAvailableResultRounds(sources: ResultDataSources): number[] {
  return sources.calendar
    .map((race) => race.round)
    .filter((round) => getAvailableSessions(sources, round).length > 0)
    .sort((a, b) => a - b);
}

export function getLatestAvailableResultRound(
  sources: ResultDataSources,
): number | null {
  return getAvailableResultRounds(sources).at(-1) ?? null;
}

export function getSessionResultStatus(
  sources: ResultDataSources,
  round: number,
  session: ResultSessionKey,
): ResultStatus {
  const classification = getSessionClassification(sources, round, session);
  if (classification) return classification.status;
  const scheduled = sources.calendar.find((item) => item.round === round)
    ?.sessions[session];
  return scheduled ? "awaiting" : "unavailable";
}
