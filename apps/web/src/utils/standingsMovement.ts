import type { ConstructorStanding, DetailedRaceResult, DriverStanding, SeasonYear } from '../types';
import { BASELINE_CUTOFF_BY_SEASON } from '../data/championship/baselineCutoff';
import { recalculateStandingsFromRaces } from '../services/standingsEngine';

export type Movement = { change: number; previousPoints: number };

export function verifiedMovement(
  season: SeasonYear,
  races: DetailedRaceResult[],
  current: { drivers: DriverStanding[]; constructors: ConstructorStanding[] },
  baseline: { drivers: DriverStanding[]; constructors: ConstructorStanding[] },
): { drivers: Map<string, Movement>; constructors: Map<string, Movement>; cutoff: number | null } {
  const empty = { drivers: new Map<string, Movement>(), constructors: new Map<string, Movement>(), cutoff: null };
  const baselineCutoff = BASELINE_CUTOFF_BY_SEASON[season];
  if (baselineCutoff.final) return empty;
  const scoring = races.filter((race) => race && !race.isSynthesized && race.round > baselineCutoff.completedRounds && (race.status === 'completed' || (race.sprintProvenance === 'official' && Boolean(race.sprintEntries?.length))));
  if (!scoring.length) return empty;
  const last = Math.max(...scoring.map((race) => race.round));
  if (scoring.length !== last - baselineCutoff.completedRounds || new Set(scoring.map((race) => race.round)).size !== scoring.length) return empty;
  const previousRaces = races.filter((race) => race.round < last);
  const prior = recalculateStandingsFromRaces(season, previousRaces, baseline.drivers, baseline.constructors);
  const expected = recalculateStandingsFromRaces(season, races, baseline.drivers, baseline.constructors);
  const same = <T extends { rank: number; points: number }>(a: T[], b: T[], key: (row: T) => string) => a.length === b.length && a.every((row) => {
    const other = b.find((candidate) => key(candidate) === key(row));
    return other?.rank === row.rank && other?.points === row.points;
  });
  if (!same(current.drivers, expected.drivers, (row) => row.driverId) || !same(current.constructors, expected.constructors, (row) => row.teamId)) return empty;
  const drivers = new Map<string, Movement>();
  const constructors = new Map<string, Movement>();
  for (const row of current.drivers) {
    const before = prior.drivers.find((entry) => entry.driverId === row.driverId);
    if (before) drivers.set(row.driverId, { change: before.rank - row.rank, previousPoints: before.points });
  }
  for (const row of current.constructors) {
    const before = prior.constructors.find((entry) => entry.teamId === row.teamId);
    if (before) constructors.set(row.teamId, { change: before.rank - row.rank, previousPoints: before.points });
  }
  return { drivers, constructors, cutoff: last };
}
