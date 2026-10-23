import {
  DetailedRaceResult,
  DetailedRaceResultEntry,
  SeasonYear,
  TeamId,
  UNKNOWN_TEAM_ID,
} from '../../types';
import { CALENDAR_2026 } from './calendar';
import { TEAMS_DATA } from '../teams';
import openF1SessionResults from './openF1SessionResults2026.json';
import { GrandPrixQualifyingData } from '../../types/qualifying';

/**
 * Bridge from OpenF1 live-timing sprint classifications into the standings
 * pipeline. The static OpenF1 snapshot (committed by CI) is the fastest
 * channel for sprint results: Jolpica lags days behind, while the sprint
 * weekend is still in progress.
 *
 * Rules (no guessing, no double counting):
 * - Only `sessions.sprint` (the race) with status `finished` counts.
 *   Sprint Qualifying never awards points.
 * - Official synced `sprintEntries` always win: provisional data only fills
 *   rounds that have none.
 * - Points prefer the official per-entry value; missing values fall back to
 *   the FIA sprint table (P1-P8: 8..1, P9+: 0).
 * - Everything is pure and idempotent: re-attaching the same source yields
 *   the same arrays, so refreshes and corrections converge instead of
 *   accumulating.
 */

export const SPRINT_POINTS_BY_POSITION: readonly number[] = [8, 7, 6, 5, 4, 3, 2, 1];

export function sprintPointsForPosition(position: number, official?: number): number {
  if (Number.isFinite(official)) return official as number;
  if (position >= 1 && position <= 8) return SPRINT_POINTS_BY_POSITION[position - 1];
  return 0;
}

export interface OpenF1SprintSource {
  getFinishedSprintEntries(season: SeasonYear, round: number): DetailedRaceResultEntry[] | null;
}

function isKnownTeam(teamId: string): teamId is TeamId {
  return teamId in TEAMS_DATA;
}

/**
 * Normalize freshly attached provisional entries: unknown constructors park
 * under the sentinel (never credited elsewhere), missing points fall back to
 * the FIA table. Official entries already stored are never rewritten here.
 */
function sanitizeSprintEntries(entries: DetailedRaceResultEntry[]): DetailedRaceResultEntry[] {
  return entries.map((entry) => ({
    ...entry,
    teamId: isKnownTeam(entry.teamId) ? entry.teamId : UNKNOWN_TEAM_ID,
    points: Number.isFinite(entry.points)
      ? entry.points
      : sprintPointsForPosition(entry.position),
  }));
}

const liveSprintSource: OpenF1SprintSource = {
  getFinishedSprintEntries(season: SeasonYear, round: number) {
    // The committed snapshot only covers 2026.
    if (season !== 2026) return null;
    const data = (openF1SessionResults as { qualifying: Record<number, GrandPrixQualifyingData> })
      .qualifying?.[round];
    const session = data?.sessions?.sprint;
    if (!session || session.status !== 'finished' || !Array.isArray(session.entries)) {
      return null;
    }
    return session.entries
      .filter((entry) => entry && Number.isFinite(entry.position))
      .map((entry) => ({
        position: entry.position,
        driverId: entry.driverId,
        driverName: entry.driverName,
        driverCode: entry.driverCode,
        driverNumber: entry.driverNumber,
        teamId: isKnownTeam(entry.teamId) ? entry.teamId : UNKNOWN_TEAM_ID,
        teamName: entry.teamName,
        laps: entry.lapsCompleted || 0,
        // OpenF1 live entries carry no status field; the official sync
        // (with status) takes priority whenever it exists.
        status: 'Finished',
        timeOrGap: entry.bestLapTime || '',
        points: sprintPointsForPosition(entry.position, entry.sprintPoints),
      }));
  },
};

function buildSprintShell(
  season: SeasonYear,
  round: number,
  sprintEntries: DetailedRaceResultEntry[],
): DetailedRaceResult | null {
  if (season !== 2026) return null;
  const cal = CALENDAR_2026.find((gp) => gp.round === round);
  if (!cal) return null;
  return {
    id: `race-${season}-r${round}-sprint-provisional`,
    season,
    round,
    grandPrix: cal.name,
    officialName: cal.officialName,
    circuit: cal.circuit,
    location: cal.location,
    country: cal.country,
    date: cal.dates,
    status: 'scheduled',
    lapsTotal: cal.laps,
    entries: [],
    sprintEntries,
    sprintProvenance: 'provisional',
    dataSource: 'OpenF1 live timing (provisional)',
  };
}

/**
 * Attach provisional OpenF1 sprint results to detailed results.
 * Replacement rule (never lose official data, always refresh provisional):
 * - existing `sprintProvenance === 'official'` → keep (official wins).
 * - existing marker absent + non-empty entries → keep (pre-marker data is
 *   treated as official/legacy and preserved).
 * - otherwise (absent marker with empty entries, or `'provisional'`) →
 *   replace with the current source so corrections propagate.
 */
export function attachOpenF1SprintResults(
  detailed: Record<SeasonYear, DetailedRaceResult[]>,
  source: OpenF1SprintSource = liveSprintSource,
): Record<SeasonYear, DetailedRaceResult[]> {
  const seasons = [2024, 2025, 2026] as SeasonYear[];
  const out = {} as Record<SeasonYear, DetailedRaceResult[]>;
  for (const season of seasons) {
    const races = Array.isArray(detailed[season]) ? detailed[season] : [];
    const byRound = new Map(races.filter(Boolean).map((race) => [race.round, race]));
    // Discover rounds with finished sprint sessions (bounded scan; the
    // snapshot only has entries for contested rounds).
    const rounds = new Set<number>(byRound.keys());
    for (let round = 1; round <= 30; round++) {
      const entries = source.getFinishedSprintEntries(season, round);
      if (!entries || entries.length === 0) continue;
      rounds.add(round);
    }
    out[season] = [...rounds]
      .sort((a, b) => a - b)
      .map((round) => {
        const existing = byRound.get(round);
        if (
          existing &&
          existing.sprintEntries &&
          existing.sprintEntries.length > 0 &&
          (existing.sprintProvenance === 'official' || !existing.sprintProvenance)
        ) {
          return existing;
        }
        const raw = source.getFinishedSprintEntries(season, round) || [];
        // No sprint data: leave the stored round untouched (no empty arrays,
        // no misleading markers).
        if (raw.length === 0) return existing || null;
        const entries = sanitizeSprintEntries(raw);
        if (existing) {
          return { ...existing, sprintEntries: entries, sprintProvenance: 'provisional' as const };
        }
        return buildSprintShell(season, round, entries);
      })
      .filter((race): race is DetailedRaceResult => race !== null);
  }
  return out;
}
