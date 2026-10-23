import {
  DetailedRaceResult,
  DriverStanding,
  ConstructorStanding,
  SeasonYear,
  TeamId,
  UNKNOWN_TEAM_ID,
} from '../types';
import { TEAMS_DATA } from '../data/teams';
import { BASELINE_CUTOFF_BY_SEASON } from '../data/championship/baselineCutoff';

// Fallback driver metadata map
const DRIVER_METADATA: Record<
  string,
  { code: string; flag: string; teamId: TeamId; teamName: string }
> = {
  verstappen: { code: 'VER', flag: '🇳🇱', teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  perez: { code: 'PER', flag: '🇲🇽', teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  leclerc: { code: 'LEC', flag: '🇲🇨', teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  sainz: { code: 'SAI', flag: '🇪🇸', teamId: 'williams', teamName: 'Williams Racing' },
  norris: { code: 'NOR', flag: '🇬🇧', teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  piastri: { code: 'PIA', flag: '🇦🇺', teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  hamilton: { code: 'HAM', flag: '🇬🇧', teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  russell: { code: 'RUS', flag: '🇬🇧', teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  antonelli: { code: 'ANT', flag: '🇮🇹', teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  alonso: { code: 'ALO', flag: '🇪🇸', teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  stroll: { code: 'STR', flag: '🇨🇦', teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  gasly: { code: 'GAS', flag: '🇫🇷', teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  doohan: { code: 'DOO', flag: '🇦🇺', teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  albon: { code: 'ALB', flag: '🇹🇭', teamId: 'williams', teamName: 'Williams Racing' },
  tsunoda: { code: 'TSU', flag: '🇯🇵', teamId: 'racingbulls', teamName: 'Visa Cash App RB F1' },
  hadjar: { code: 'HAD', flag: '🇫🇷', teamId: 'racingbulls', teamName: 'Visa Cash App RB F1' },
  hulkenberg: { code: 'HUL', flag: '🇩🇪', teamId: 'audi', teamName: 'Audi Formula 1 Team' },
  bortoleto: { code: 'BOR', flag: '🇧🇷', teamId: 'audi', teamName: 'Audi Formula 1 Team' },
  bearman: { code: 'BEA', flag: '🇬🇧', teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  ocon: { code: 'OCO', flag: '🇫🇷', teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  lawson: { code: 'LAW', flag: '🇳🇿', teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  colapinto: { code: 'COL', flag: '🇦🇷', teamId: 'williams', teamName: 'Williams Racing' },
  ricciardo: { code: 'RIC', flag: '🇦🇺', teamId: 'racingbulls', teamName: 'Visa Cash App RB F1' },
  magnussen: { code: 'MAG', flag: '🇩🇰', teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  bottas: { code: 'BOT', flag: '🇫🇮', teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  zhou: { code: 'ZHO', flag: '🇨🇳', teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  sargeant: { code: 'SAR', flag: '🇺🇸', teamId: 'williams', teamName: 'Williams Racing' },
};

// Authoritative locked team mapping to guarantee accuracy against corrupt/external entries
export const LOCKED_DRIVERS: Record<string, { teamId: TeamId; teamName: string }> = {
  piastri: { teamId: 'mclaren', teamName: 'McLaren' },
  norris: { teamId: 'mclaren', teamName: 'McLaren' },
  russell: { teamId: 'mercedes', teamName: 'Mercedes' },
  antonelli: { teamId: 'mercedes', teamName: 'Mercedes' },
  hamilton: { teamId: 'ferrari', teamName: 'Ferrari' },
  leclerc: { teamId: 'ferrari', teamName: 'Ferrari' },
  verstappen: { teamId: 'redbull', teamName: 'Red Bull' },
  hadjar: { teamId: 'redbull', teamName: 'Red Bull' },
  lawson: { teamId: 'racingbulls', teamName: 'RB F1 Team' },
  lindblad: { teamId: 'racingbulls', teamName: 'RB F1 Team' },
  gasly: { teamId: 'alpine', teamName: 'Alpine F1 Team' },
  colapinto: { teamId: 'alpine', teamName: 'Alpine F1 Team' },
  bearman: { teamId: 'haas', teamName: 'Haas F1 Team' },
  ocon: { teamId: 'haas', teamName: 'Haas F1 Team' },
  hulkenberg: { teamId: 'audi', teamName: 'Audi' },
  bortoleto: { teamId: 'audi', teamName: 'Audi' },
  alonso: { teamId: 'astonmartin', teamName: 'Aston Martin' },
  stroll: { teamId: 'astonmartin', teamName: 'Aston Martin' },
  sainz: { teamId: 'williams', teamName: 'Williams' },
  albon: { teamId: 'williams', teamName: 'Williams' },
  bottas: { teamId: 'cadillac', teamName: 'Cadillac F1 Team' },
  perez: { teamId: 'cadillac', teamName: 'Cadillac F1 Team' },
};

/**
 * Recalculates Driver and Constructor Championship standings dynamically
 * directly from raw race classification entries.
 */
export function recalculateStandingsFromRaces(
  season: SeasonYear,
  races: DetailedRaceResult[],
  baseDrivers: DriverStanding[] = [],
  baseConstructors: ConstructorStanding[] = [],
): { drivers: DriverStanding[]; constructors: ConstructorStanding[] } {
  // If season is already completed (2024 or 2025), standings are official and final
  if (season !== 2026) {
    return {
      drivers: baseDrivers,
      constructors: baseConstructors,
    };
  }

  // For 2026 (ongoing season after 17 events):
  // Initialize with official baseline standings (reflecting events 1-17)
  const driverMap = new Map<
    string,
    {
      driverId: string;
      driverName: string;
      driverCode: string;
      teamId: TeamId;
      teamName: string;
      points: number;
      wins: number;
      podiums: number;
      countryFlag: string;
    }
  >();

  const constructorMap = new Map<
    string,
    {
      teamId: TeamId;
      teamName: string;
      points: number;
      wins: number;
      podiums: number;
      engine: string;
    }
  >();

  // Ignore sentinel unknowns so unmatched race records never invent phantom
  // driver/team standings or points.
  const canonicalBaseDrivers = baseDrivers.filter((d) => d?.driverId && d.driverId !== 'unknown');
  const canonicalBaseConstructors = baseConstructors.filter(
    (c) => c?.teamId && c.teamId !== UNKNOWN_TEAM_ID,
  );

  // Initialize driverMap with existing official baseline standings
  canonicalBaseDrivers.forEach((d) => {
    const locked = LOCKED_DRIVERS[d.driverId];
    driverMap.set(d.driverId, {
      driverId: d.driverId,
      driverName: d.driverName,
      driverCode: d.driverCode,
      teamId: locked?.teamId || d.teamId,
      teamName: locked?.teamName || d.teamName,
      points: d.points,
      wins: d.wins,
      podiums: d.podiums,
      countryFlag: d.countryFlag,
    });
  });

  // Initialize constructorMap with existing official baseline standings
  canonicalBaseConstructors.forEach((c) => {
    constructorMap.set(c.teamId, {
      teamId: c.teamId,
      teamName: c.teamName,
      points: c.points,
      wins: c.wins,
      podiums: c.podiums,
      engine: c.engine,
    });
  });

  // Defensive guard: if baseline drivers have 0 recorded podiums (e.g. from an unpopulated source/cache),
  // recover podium totals by tallying top-3 finishes across all available completed races.
  const hasBasePodiums = baseDrivers.some((d) => (d.podiums || 0) > 0);
  if (!hasBasePodiums && Array.isArray(races) && races.length > 0) {
    const racePodiumsByDriver = new Map<string, number>();
    const racePodiumsByTeam = new Map<string, number>();
    races
      .filter((r) => r && r.status === 'completed')
      .forEach((r) => {
        (r.entries || []).forEach((e) => {
          if (!e || e.position < 1 || e.position > 3) return;
          if (e.driverId && e.driverId !== 'unknown') {
            racePodiumsByDriver.set(e.driverId, (racePodiumsByDriver.get(e.driverId) || 0) + 1);
          }
          if (e.teamId && e.teamId !== UNKNOWN_TEAM_ID) {
            racePodiumsByTeam.set(e.teamId, (racePodiumsByTeam.get(e.teamId) || 0) + 1);
          }
        });
      });
    driverMap.forEach((driver, id) => {
      const p = racePodiumsByDriver.get(id);
      if (p !== undefined) driver.podiums = p;
    });
    constructorMap.forEach((team, id) => {
      const p = racePodiumsByTeam.get(id);
      if (p !== undefined) team.podiums = p;
    });
  }

  // Rounds at or below the baseline cutoff are already included in the official
  // baseline standings (see BASELINE_CUTOFF_BY_SEASON). Sprint points are added
  // exactly once, in the sprint loop below — never in the race loop.
  const cutoff = BASELINE_CUTOFF_BY_SEASON[season]?.completedRounds ?? 16;
  const additionalRaces = (Array.isArray(races) ? races : []).filter(
    (r) => r && !r.isSynthesized && r.round > cutoff,
  );

  additionalRaces.forEach((race) => {
    const entries = race.status === 'completed' && Array.isArray(race.entries) ? race.entries : [];
    entries.forEach((entry) => {
      if (!entry) return;
      if (!entry.driverId || entry.driverId === 'unknown') return;

      // Driver points increment
      const existingDriver = driverMap.get(entry.driverId);
      const locked = LOCKED_DRIVERS[entry.driverId];
      if (existingDriver) {
        existingDriver.points += entry.points || 0;
        if (entry.position === 1) existingDriver.wins += 1;
        if (entry.position >= 1 && entry.position <= 3) existingDriver.podiums += 1;
        existingDriver.teamId = locked?.teamId || entry.teamId;
        existingDriver.teamName = locked?.teamName || entry.teamName;
        driverMap.set(entry.driverId, existingDriver);
      } else {
        const dMeta = DRIVER_METADATA[entry.driverId] || {
          code: entry.driverCode || 'F1',
          flag: '🏁',
          teamId: locked?.teamId || entry.teamId,
          teamName: locked?.teamName || entry.teamName,
        };
        driverMap.set(entry.driverId, {
          driverId: entry.driverId,
          driverName: entry.driverName,
          driverCode: dMeta.code,
          teamId: locked?.teamId || entry.teamId,
          teamName: locked?.teamName || entry.teamName,
          points: entry.points || 0,
          wins: entry.position === 1 ? 1 : 0,
          podiums: entry.position >= 1 && entry.position <= 3 ? 1 : 0,
          countryFlag: dMeta.flag,
        });
      }

      // Constructor points increment (race points only; sprint is added once below)
      const teamId = entry.teamId;
      if (teamId && teamId !== UNKNOWN_TEAM_ID) {
        const existingTeam = constructorMap.get(teamId);
        if (existingTeam) {
          existingTeam.points += entry.points || 0;
          if (entry.position === 1) existingTeam.wins += 1;
          if (entry.position >= 1 && entry.position <= 3) existingTeam.podiums += 1;
          constructorMap.set(teamId, existingTeam);
        } else {
          const teamInfo = TEAMS_DATA[teamId];
          constructorMap.set(teamId, {
            teamId,
            teamName: teamInfo?.name || entry.teamName,
            points: entry.points || 0,
            wins: entry.position === 1 ? 1 : 0,
            podiums: entry.position >= 1 && entry.position <= 3 ? 1 : 0,
            engine: teamInfo?.powerUnit || 'Hybrid Turbo V6',
          });
        }
      }
    });

    // Sprint points are counted exactly once: explicit sprintEntries win when
    // present, otherwise legacy per-entry sprintPoints are derived. Never both.
    const explicitSprint = Array.isArray(race.sprintEntries) ? race.sprintEntries : [];
    const legacySprint =
      explicitSprint.length === 0
        ? entries
            .filter((entry) => entry && entry.sprintPoints)
            .map((entry) => ({
              ...entry,
              points: entry.sprintPoints || 0,
            }))
        : [];
    const sprintEntries = [...explicitSprint, ...legacySprint];
    sprintEntries.forEach((entry) => {
      if (!entry) return;
      if (!entry.driverId || entry.driverId === 'unknown') return;
      const points = entry.points || 0;
      const locked = LOCKED_DRIVERS[entry.driverId];
      const existingDriver = driverMap.get(entry.driverId);
      if (existingDriver) {
        existingDriver.points += points;
      } else {
        const dMeta = DRIVER_METADATA[entry.driverId] || {
          code: entry.driverCode || 'F1',
          flag: '🏁',
          teamId: locked?.teamId || entry.teamId,
          teamName: locked?.teamName || entry.teamName,
        };
        driverMap.set(entry.driverId, {
          driverId: entry.driverId,
          driverName: entry.driverName,
          driverCode: dMeta.code,
          teamId: locked?.teamId || entry.teamId,
          teamName: locked?.teamName || entry.teamName,
          points,
          wins: 0,
          podiums: 0,
          countryFlag: dMeta.flag,
        });
      }

      if (entry.teamId && entry.teamId !== UNKNOWN_TEAM_ID) {
        const existingTeam = constructorMap.get(entry.teamId);
        if (existingTeam) {
          existingTeam.points += points;
        } else {
          const teamInfo = TEAMS_DATA[entry.teamId];
          constructorMap.set(entry.teamId, {
            teamId: entry.teamId,
            teamName: teamInfo?.name || entry.teamName,
            points,
            wins: 0,
            podiums: 0,
            engine: teamInfo?.powerUnit || 'Hybrid Turbo V6',
          });
        }
      }
    });
  });

  // FIA countback support: finishing-position histograms over the full Grand
  // Prix history available in the input (not only rounds past the cutoff).
  // Rounds missing from the data (e.g. most baseline rounds, which only exist
  // as totals) contribute through wins/podiums, which are compared BEFORE the
  // histograms. Ties deeper than the available detail fall back to total
  // podiums — deterministic, but not claimed to be FIA-exact in that case.
  const driverHistograms = new Map<string, number[]>();
  const teamHistograms = new Map<string, number[]>();
  const tally = (map: Map<string, number[]>, key: string, position: number) => {
    if (position < 1 || position > 10) return;
    let hist = map.get(key);
    if (!hist) {
      hist = new Array(11).fill(0);
      map.set(key, hist);
    }
    hist[position] += 1;
  };
  (Array.isArray(races) ? races : [])
    .filter((r) => r && !r.isSynthesized)
    .forEach((race) => {
      const entries =
        race.status === 'completed' && Array.isArray(race.entries) ? race.entries : [];
      // FIA countback uses Grand Prix finishes only: sprint positions never
      // decide ties, for drivers or constructors.
      entries.forEach((entry) => {
        if (!entry) return;
        tally(driverHistograms, entry.driverId, entry.position);
        tally(teamHistograms, entry.teamId, entry.position);
      });
    });
  const zeros = () => new Array(11).fill(0);
  // Sort: Points DESC -> Wins DESC -> P2 DESC -> ... -> P10 DESC -> Podiums DESC.
  // Matches the FIA countback order for the available data; where detailed
  // history is missing, the trailing podiums fallback keeps the order
  // deterministic without claiming FIA-exactness.
  const compareCountback = (
    a: { points: number; wins: number; podiums: number },
    b: { points: number; wins: number; podiums: number },
    histA: number[],
    histB: number[],
  ): number => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    for (let pos = 2; pos <= 10; pos++) {
      if (histB[pos] !== histA[pos]) return histB[pos] - histA[pos];
    }
    return b.podiums - a.podiums;
  };

  // Sort and rank drivers: Points DESC -> Wins DESC -> P2..P10 DESC -> Podiums DESC
  const rankedDrivers: DriverStanding[] = Array.from(driverMap.values())
    .sort((a, b) =>
      compareCountback(
        a,
        b,
        driverHistograms.get(a.driverId) || zeros(),
        driverHistograms.get(b.driverId) || zeros(),
      ),
    )
    .map((item, idx) => {
      const locked = LOCKED_DRIVERS[item.driverId];
      return {
        ...item,
        teamId: locked?.teamId || item.teamId,
        teamName: locked?.teamName || item.teamName,
        rank: idx + 1,
      };
    });

  // Sort and rank constructors: Points DESC -> Wins DESC -> P2..P10 DESC -> Podiums DESC
  const rankedConstructors: ConstructorStanding[] = Array.from(constructorMap.values())
    .sort((a, b) =>
      compareCountback(
        a,
        b,
        teamHistograms.get(a.teamId) || zeros(),
        teamHistograms.get(b.teamId) || zeros(),
      ),
    )
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  return {
    drivers: rankedDrivers,
    constructors: rankedConstructors,
  };
}
