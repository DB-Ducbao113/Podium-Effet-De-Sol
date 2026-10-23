import { GrandPrixQualifyingData, QualifyingEntry, QualifyingSessionResult } from '../../types/qualifying';
import { CALENDAR_2026 } from './calendar';
import { TeamId } from '../../types/team';

interface GridDriver {
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: TeamId;
  teamName: string;
}

const DRIVERS: GridDriver[] = [
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

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return `${m}:${s.padStart(6, '0')}`;
}

interface RoundConfig {
  baseTime: number; // in seconds
  poleDriverId: string;
  order: string[]; // driverIds in finishing order
  sprintPoleDriverId?: string;
  sprintOrder?: string[];
  sprintWinnerId?: string;
}

const ROUND_CONFIGS: Record<number, RoundConfig> = {
  1: {
    baseTime: 76.892,
    poleDriverId: 'russell',
    order: ['russell', 'antonelli', 'leclerc', 'verstappen', 'norris', 'hamilton', 'piastri', 'hadjar', 'sainz', 'albon', 'lawson', 'alonso', 'bearman', 'lindblad', 'hulkenberg', 'ocon', 'gasly', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  2: {
    baseTime: 93.421,
    poleDriverId: 'antonelli',
    order: ['antonelli', 'russell', 'hamilton', 'leclerc', 'norris', 'verstappen', 'piastri', 'hadjar', 'lawson', 'sainz', 'albon', 'alonso', 'lindblad', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintPoleDriverId: 'russell',
    sprintOrder: ['antonelli', 'russell', 'hamilton', 'verstappen', 'norris', 'leclerc', 'piastri', 'hadjar', 'sainz', 'lawson', 'albon', 'alonso', 'bearman', 'lindblad', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintWinnerId: 'antonelli',
  },
  3: {
    baseTime: 88.197,
    poleDriverId: 'antonelli',
    order: ['antonelli', 'piastri', 'leclerc', 'verstappen', 'russell', 'norris', 'hamilton', 'hadjar', 'lawson', 'sainz', 'lindblad', 'albon', 'alonso', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  4: {
    baseTime: 86.842,
    poleDriverId: 'antonelli',
    order: ['antonelli', 'norris', 'piastri', 'russell', 'leclerc', 'verstappen', 'hamilton', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintPoleDriverId: 'norris',
    sprintOrder: ['norris', 'antonelli', 'piastri', 'russell', 'verstappen', 'leclerc', 'hamilton', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'alonso', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
    sprintWinnerId: 'norris',
  },
  5: {
    baseTime: 71.450,
    poleDriverId: 'hamilton',
    order: ['hamilton', 'antonelli', 'verstappen', 'russell', 'norris', 'leclerc', 'piastri', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'alonso', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintPoleDriverId: 'antonelli',
    sprintOrder: ['antonelli', 'hamilton', 'verstappen', 'russell', 'leclerc', 'norris', 'piastri', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'alonso', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintWinnerId: 'antonelli',
  },
  6: {
    baseTime: 70.270,
    poleDriverId: 'leclerc',
    order: ['leclerc', 'antonelli', 'hamilton', 'hadjar', 'russell', 'norris', 'verstappen', 'piastri', 'sainz', 'lawson', 'albon', 'alonso', 'lindblad', 'bearman', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  7: {
    baseTime: 72.190,
    poleDriverId: 'hamilton',
    order: ['hamilton', 'russell', 'norris', 'antonelli', 'leclerc', 'verstappen', 'piastri', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
  },
  8: {
    baseTime: 64.380,
    poleDriverId: 'verstappen',
    order: ['verstappen', 'russell', 'antonelli', 'norris', 'leclerc', 'hamilton', 'hadjar', 'piastri', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  9: {
    baseTime: 85.819,
    poleDriverId: 'russell',
    order: ['russell', 'leclerc', 'hamilton', 'antonelli', 'norris', 'verstappen', 'piastri', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintPoleDriverId: 'russell',
    sprintOrder: ['russell', 'leclerc', 'hamilton', 'antonelli', 'norris', 'verstappen', 'piastri', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintWinnerId: 'russell',
  },
  10: {
    baseTime: 103.205,
    poleDriverId: 'leclerc',
    order: ['leclerc', 'antonelli', 'verstappen', 'norris', 'russell', 'hamilton', 'piastri', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  11: {
    baseTime: 75.227,
    poleDriverId: 'norris',
    order: ['norris', 'verstappen', 'antonelli', 'leclerc', 'russell', 'piastri', 'hamilton', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
  },
  12: {
    baseTime: 69.673,
    poleDriverId: 'norris',
    order: ['norris', 'antonelli', 'russell', 'verstappen', 'leclerc', 'piastri', 'hamilton', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintPoleDriverId: 'norris',
    sprintOrder: ['norris', 'antonelli', 'russell', 'verstappen', 'leclerc', 'piastri', 'hamilton', 'hadjar', 'sainz', 'lawson', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
    sprintWinnerId: 'norris',
  },
  13: {
    baseTime: 79.301,
    poleDriverId: 'russell',
    order: ['russell', 'antonelli', 'verstappen', 'norris', 'leclerc', 'hamilton', 'piastri', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  14: {
    baseTime: 73.904,
    poleDriverId: 'antonelli',
    order: ['antonelli', 'verstappen', 'norris', 'russell', 'leclerc', 'hamilton', 'piastri', 'hadjar', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
  },
  15: {
    baseTime: 101.160,
    poleDriverId: 'leclerc',
    order: ['leclerc', 'verstappen', 'russell', 'antonelli', 'hadjar', 'hamilton', 'norris', 'piastri', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'bottas', 'perez'],
  },
  16: {
    baseTime: 93.985,
    poleDriverId: 'russell',
    order: ['russell', 'verstappen', 'antonelli', 'leclerc', 'norris', 'hamilton', 'hadjar', 'piastri', 'lawson', 'sainz', 'albon', 'lindblad', 'bearman', 'alonso', 'gasly', 'hulkenberg', 'ocon', 'colapinto', 'bortoleto', 'stroll', 'perez', 'bottas'],
  },
};

const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

function buildQualifyingEntries(
  orderedDriverIds: string[],
  baseTime: number,
  isSprintRace: boolean = false
): QualifyingEntry[] {
  const driverMap = new Map(DRIVERS.map((d) => [d.driverId, d]));

  return orderedDriverIds.map((driverId, idx) => {
    const driver = driverMap.get(driverId) || {
      driverId,
      driverName: driverId,
      driverCode: driverId.slice(0, 3).toUpperCase(),
      driverNumber: idx + 1,
      teamId: 'mercedes' as TeamId,
      teamName: 'Mercedes-AMG PETRONAS F1',
    };

    const pos = idx + 1;
    const gapSec = pos === 1 ? 0 : 0.045 + (pos - 1) * 0.082 + ((pos * 13) % 40) / 1000;
    const driverTime = baseTime + gapSec;

    if (isSprintRace) {
      // Sprint race finishes
      const sprintPts = pos <= 8 ? SPRINT_POINTS[pos - 1] : undefined;
      const sprintGap = pos === 1 ? 'LEADER' : `+${gapSec.toFixed(3)}s`;
      return {
        position: pos,
        driverId: driver.driverId,
        driverName: driver.driverName,
        driverCode: driver.driverCode,
        driverNumber: driver.driverNumber,
        teamId: driver.teamId,
        teamName: driver.teamName,
        bestLapTime: fmtTime(driverTime),
        gapToPole: sprintGap,
        lapsCompleted: 19,
        sprintPoints: sprintPts,
      };
    }

    // Normal qualifying: Q1, Q2, Q3
    const q1Gap = 0.45 + (pos * 11 % 30) / 100;
    const q2Gap = 0.22 + (pos * 7 % 20) / 100;
    const q1Time = fmtTime(baseTime + q1Gap + (pos > 16 ? gapSec : 0));
    const q2Time = pos <= 16 ? fmtTime(baseTime + q2Gap + (pos > 10 ? gapSec : 0)) : undefined;
    const q3Time = pos <= 10 ? fmtTime(driverTime) : undefined;
    const bestLap = q3Time || q2Time || q1Time;
    const gapDisplay = pos === 1 ? 'POLE' : `+${gapSec.toFixed(3)}s`;

    return {
      position: pos,
      driverId: driver.driverId,
      driverName: driver.driverName,
      driverCode: driver.driverCode,
      driverNumber: driver.driverNumber,
      teamId: driver.teamId,
      teamName: driver.teamName,
      q1Time,
      q2Time,
      q3Time,
      bestLapTime: bestLap,
      gapToPole: gapDisplay,
      lapsCompleted: pos <= 10 ? 18 : pos <= 16 ? 12 : 7,
    };
  });
}

function generateQualifyingData(): Record<number, GrandPrixQualifyingData> {
  const result: Record<number, GrandPrixQualifyingData> = {};

  CALENDAR_2026.forEach((gp) => {
    const config = ROUND_CONFIGS[gp.round];
    if (!config) return;

    const poleDriver = DRIVERS.find((d) => d.driverId === config.poleDriverId);
    const qualiEntries = buildQualifyingEntries(config.order, config.baseTime, false);

    const qualiSession: QualifyingSessionResult = {
      sessionKey: 'qualifying',
      sessionName: 'Qualifying',
      dateStr: gp.sessions.qualifying.dateStr,
      status: 'finished',
      weather: 'Dry / Optimal',
      airTempC: 28,
      trackTempC: 39,
      poleDriver: poleDriver
        ? {
            driver: poleDriver.driverName,
            team: poleDriver.teamName,
            time: fmtTime(config.baseTime),
          }
        : undefined,
      entries: qualiEntries,
    };

    const sessionsObj: GrandPrixQualifyingData['sessions'] = {
      qualifying: qualiSession,
    };

    if (gp.hasSprint && config.sprintOrder) {
      // Sprint Qualifying
      const sqPole = DRIVERS.find((d) => d.driverId === config.sprintPoleDriverId);
      const sqEntries = buildQualifyingEntries(config.sprintOrder, config.baseTime + 0.35, false);
      sessionsObj.sprintQualifying = {
        sessionKey: 'sprintQualifying',
        sessionName: 'Sprint Qualifying',
        dateStr: gp.sessions.sprintQualifying?.dateStr || gp.dates,
        status: 'finished',
        weather: 'Dry / Optimal',
        airTempC: 27,
        trackTempC: 38,
        poleDriver: sqPole
          ? {
              driver: sqPole.driverName,
              team: sqPole.teamName,
              time: fmtTime(config.baseTime + 0.35),
            }
          : undefined,
        entries: sqEntries,
      };

      // Sprint Race
      const sprintWinner = DRIVERS.find((d) => d.driverId === config.sprintWinnerId);
      const sprintEntries = buildQualifyingEntries(config.sprintOrder, config.baseTime + 1.2, true);
      sessionsObj.sprint = {
        sessionKey: 'sprint',
        sessionName: 'Sprint',
        dateStr: gp.sessions.sprint?.dateStr || gp.dates,
        status: 'finished',
        weather: 'Sunny / Dry',
        airTempC: 29,
        trackTempC: 41,
        poleDriver: sprintWinner
          ? {
              driver: sprintWinner.driverName,
              team: sprintWinner.teamName,
              time: '28:15.758',
            }
          : undefined,
        entries: sprintEntries,
      };
    }

    result[gp.round] = {
      round: gp.round,
      grandPrix: gp.name,
      season: gp.season,
      circuit: gp.circuit,
      sessions: sessionsObj,
    };
  });

  return result;
}

export const QUALIFYING_RESULTS_2026: Record<number, GrandPrixQualifyingData> = generateQualifyingData();
