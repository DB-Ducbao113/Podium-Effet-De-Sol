import {
  DetailedRaceResult,
  DetailedRaceResultEntry,
  SeasonYear,
  TeamId,
  UNKNOWN_TEAM_ID,
} from '../../types';
import { getRaceResults } from './results';
import { CALENDAR_2024, CALENDAR_2025, CALENDAR_2026 } from './calendar';

// Reference driver pool per season
interface GridDriver {
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: TeamId;
  teamName: string;
}

const DRIVER_GRID_2026: GridDriver[] = [
  { driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', driverNumber: 63, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', driverNumber: 12, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', driverNumber: 3, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', driverNumber: 6, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', driverNumber: 16, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', driverNumber: 44, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', driverNumber: 1, teamId: 'mclaren', teamName: 'McLaren Mastercard F1 Team' },
  { driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', driverNumber: 81, teamId: 'mclaren', teamName: 'McLaren Mastercard F1 Team' },
  { driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', driverNumber: 55, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', driverNumber: 23, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', driverNumber: 14, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', driverNumber: 18, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', driverNumber: 30, teamId: 'racingbulls', teamName: 'Visa Cash App Racing Bulls' },
  { driverId: 'lindblad', driverName: 'Arvid Lindblad', driverCode: 'LIN', driverNumber: 41, teamId: 'racingbulls', teamName: 'Visa Cash App Racing Bulls' },
  { driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', driverNumber: 31, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', driverNumber: 87, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', driverNumber: 27, teamId: 'audi', teamName: 'Audi Revolut F1 Team' },
  { driverId: 'bortoleto', driverName: 'Gabriel Bortoleto', driverCode: 'BOR', driverNumber: 5, teamId: 'audi', teamName: 'Audi Revolut F1 Team' },
  { driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', driverNumber: 10, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  { driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', driverNumber: 43, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  { driverId: 'perez', driverName: 'Sergio Pérez', driverCode: 'PER', driverNumber: 11, teamId: 'cadillac', teamName: 'Cadillac Formula 1 Team' },
  { driverId: 'bottas', driverName: 'Valtteri Bottas', driverCode: 'BOT', driverNumber: 77, teamId: 'cadillac', teamName: 'Cadillac Formula 1 Team' },
];

const DRIVER_GRID_2025: GridDriver[] = [
  { driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', driverNumber: 4, teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  { driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', driverNumber: 81, teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  { driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', driverNumber: 1, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'tsunoda', driverName: 'Yuki Tsunoda', driverCode: 'TSU', driverNumber: 22, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', driverNumber: 16, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', driverNumber: 44, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', driverNumber: 63, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'antonelli', driverName: 'Andrea Kimi Antonelli', driverCode: 'ANT', driverNumber: 12, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', driverNumber: 55, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', driverNumber: 23, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', driverNumber: 14, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', driverNumber: 18, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'hadjar', driverName: 'Isack Hadjar', driverCode: 'HAD', driverNumber: 6, teamId: 'racingbulls', teamName: 'Racing Bulls F1 Team' },
  { driverId: 'lawson', driverName: 'Liam Lawson', driverCode: 'LAW', driverNumber: 30, teamId: 'racingbulls', teamName: 'Racing Bulls F1 Team' },
  { driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', driverNumber: 27, teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  { driverId: 'bortoleto', driverName: 'Gabriel Bortoleto', driverCode: 'BOR', driverNumber: 5, teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  { driverId: 'bearman', driverName: 'Oliver Bearman', driverCode: 'BEA', driverNumber: 87, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', driverNumber: 31, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', driverNumber: 10, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  { driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', driverNumber: 43, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
];

const DRIVER_GRID_2024: GridDriver[] = [
  { driverId: 'verstappen', driverName: 'Max Verstappen', driverCode: 'VER', driverNumber: 1, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'norris', driverName: 'Lando Norris', driverCode: 'NOR', driverNumber: 4, teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  { driverId: 'leclerc', driverName: 'Charles Leclerc', driverCode: 'LEC', driverNumber: 16, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'piastri', driverName: 'Oscar Piastri', driverCode: 'PIA', driverNumber: 81, teamId: 'mclaren', teamName: 'McLaren Formula 1 Team' },
  { driverId: 'sainz', driverName: 'Carlos Sainz', driverCode: 'SAI', driverNumber: 55, teamId: 'ferrari', teamName: 'Scuderia Ferrari HP' },
  { driverId: 'russell', driverName: 'George Russell', driverCode: 'RUS', driverNumber: 63, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'hamilton', driverName: 'Lewis Hamilton', driverCode: 'HAM', driverNumber: 44, teamId: 'mercedes', teamName: 'Mercedes-AMG PETRONAS F1' },
  { driverId: 'perez', driverName: 'Sergio Pérez', driverCode: 'PER', driverNumber: 11, teamId: 'redbull', teamName: 'Oracle Red Bull Racing' },
  { driverId: 'alonso', driverName: 'Fernando Alonso', driverCode: 'ALO', driverNumber: 14, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'gasly', driverName: 'Pierre Gasly', driverCode: 'GAS', driverNumber: 10, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  { driverId: 'hulkenberg', driverName: 'Nico Hülkenberg', driverCode: 'HUL', driverNumber: 27, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'tsunoda', driverName: 'Yuki Tsunoda', driverCode: 'TSU', driverNumber: 22, teamId: 'racingbulls', teamName: 'Visa Cash App RB F1' },
  { driverId: 'stroll', driverName: 'Lance Stroll', driverCode: 'STR', driverNumber: 18, teamId: 'astonmartin', teamName: 'Aston Martin Aramco F1' },
  { driverId: 'ocon', driverName: 'Esteban Ocon', driverCode: 'OCO', driverNumber: 31, teamId: 'alpine', teamName: 'BWT Alpine F1 Team' },
  { driverId: 'magnussen', driverName: 'Kevin Magnussen', driverCode: 'MAG', driverNumber: 20, teamId: 'haas', teamName: 'MoneyGram Haas F1 Team' },
  { driverId: 'albon', driverName: 'Alexander Albon', driverCode: 'ALB', driverNumber: 23, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'colapinto', driverName: 'Franco Colapinto', driverCode: 'COL', driverNumber: 43, teamId: 'williams', teamName: 'Williams Racing' },
  { driverId: 'zhou', driverName: 'Zhou Guanyu', driverCode: 'ZHO', driverNumber: 24, teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  { driverId: 'bottas', driverName: 'Valtteri Bottas', driverCode: 'BOT', driverNumber: 77, teamId: 'audi', teamName: 'Kick Sauber F1 Team' },
  { driverId: 'ricciardo', driverName: 'Daniel Ricciardo', driverCode: 'RIC', driverNumber: 3, teamId: 'racingbulls', teamName: 'Visa Cash App RB F1' },
];

const FIA_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

/**
 * Fastest-lap bonus point rule.
 * 2024 keeps +1 only for a top-10 finisher holding the fastest lap;
 * removed from 2025 onwards.
 */
export function fastestLapBonusPoints(
  season: SeasonYear,
  position: number,
  isFastestLap: boolean,
): number {
  if (!isFastestLap || position < 1 || position > 10) return 0;
  return season === 2024 ? 1 : 0;
}

function normalizeDriverName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

function findGridDriver(name: string, grid: GridDriver[]): GridDriver | undefined {
  const norm = normalizeDriverName(name);
  return grid.find((d) => {
    const dNorm = normalizeDriverName(d.driverName);
    return dNorm.includes(norm) || norm.includes(dNorm) || d.driverCode.toLowerCase() === norm;
  });
}

export function getCompleteRaceClassification(
  season: SeasonYear,
  round: number,
  detailedList?: DetailedRaceResult[]
): DetailedRaceResult | null {
  // 1. Real classification data (baseline or synced/applied) always wins —
  //    even when the grid is sparse. Real rows are never replaced by
  //    synthesized ones, so the modal always forwards the actual race result.
  const existingDetailed = detailedList?.find((r) => r.round === round);
  if (existingDetailed && existingDetailed.entries && existingDetailed.entries.length > 0) {
    return existingDetailed;
  }

  // 2. No detailed entries: forward the official podium summary (P1–P3 only).
  //    Rows beyond P3 are never invented (no fake gaps, laps or DNFs).
  const summaryList = getRaceResults(season);
  const summary = summaryList.find((r) => r.round === round);
  if (!summary) return existingDetailed || null;

  const grid = season === 2026 ? DRIVER_GRID_2026 : season === 2025 ? DRIVER_GRID_2025 : DRIVER_GRID_2024;
  const calendar = season === 2026 ? CALENDAR_2026 : season === 2025 ? CALENDAR_2025 : CALENDAR_2024;
  const calRound = calendar.find((c) => c.round === round);
  const lapsTotal = calRound?.laps || (summary.circuit.toLowerCase().includes('monaco') ? 78 : summary.circuit.toLowerCase().includes('spa') ? 44 : 57);

  const podiumRows = [
    {
      position: 1 as const,
      driver: summary.podium.p1.driver,
      team: summary.podium.p1.team,
      timeOrGap: summary.podium.p1.time,
      points: summary.podium.p1.points,
    },
    {
      position: 2 as const,
      driver: summary.podium.p2.driver,
      team: summary.podium.p2.team,
      timeOrGap: summary.podium.p2.gap,
      points: summary.podium.p2.points,
    },
    {
      position: 3 as const,
      driver: summary.podium.p3.driver,
      team: summary.podium.p3.team,
      timeOrGap: summary.podium.p3.gap,
      points: summary.podium.p3.points,
    },
  ];

  const entries: DetailedRaceResultEntry[] = podiumRows.map((row) => {
    const gridDriver = findGridDriver(row.driver, grid);
    const isFl = summary.fastestLap?.driver === row.driver;
    const isFastestLapAwarded = season < 2025 && isFl;
    return {
      position: row.position,
      driverId: gridDriver?.driverId || 'unknown',
      driverName: row.driver,
      driverCode: gridDriver?.driverCode || row.driver.slice(0, 3).toUpperCase(),
      driverNumber: gridDriver?.driverNumber,
      teamId: gridDriver?.teamId || UNKNOWN_TEAM_ID,
      teamName: row.team,
      laps: lapsTotal,
      status: 'Finished',
      timeOrGap: row.timeOrGap,
      points: row.points ?? FIA_POINTS[row.position - 1],
      fastestLap: isFastestLapAwarded,
      fastestLapTime: isFastestLapAwarded && summary.fastestLap ? summary.fastestLap.time : undefined,
    };
  });

  return {
    id: `race-${season}-r${round}`,
    season,
    round,
    grandPrix: summary.grandPrix,
    officialName: `FORMULA 1 ${summary.grandPrix.toUpperCase()} ${season}`,
    circuit: summary.circuit,
    location: calRound?.location,
    country: calRound?.country,
    date: summary.date,
    status: 'completed',
    lapsTotal,
    winner: {
      driver: summary.podium.p1.driver,
      team: summary.podium.p1.team,
      time: summary.podium.p1.time,
    },
    fastestLap: summary.fastestLap,
    entries,
    // Podium-only view assembled from the official summary — display-only,
    // excluded from standings calculation.
    isSynthesized: true,
  };
}
