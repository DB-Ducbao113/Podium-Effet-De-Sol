import { SeasonYear } from './common';
import { TeamId } from './team';

export interface DriverStanding {
  rank: number;
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

export interface ConstructorStanding {
  rank: number;
  teamId: TeamId;
  teamName: string;
  points: number;
  wins: number;
  podiums: number;
  engine: string;
}

export type SeasonStatus = 'completed' | 'ongoing';

export interface SeasonStandings {
  season: SeasonYear;
  status: SeasonStatus;
  lastUpdated?: string;
  notes?: string;
  leaderTitle?: string;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}

export type SessionStatus = 'scheduled' | 'live' | 'finished';

export interface WeekendSession {
  name: string;
  dateStr: string;
  timeStr: string;
  status: SessionStatus;
}

export interface GrandPrixRound {
  round: number;
  name: string;
  officialName: string;
  circuit: string;
  location: string;
  country: string;
  countryCode: string;
  flag: string;
  dates: string;
  season: SeasonYear;
  status: 'completed' | 'current' | 'upcoming';
  hasSprint: boolean;
  laps: number;
  circuitLengthKm: number;
  raceDistanceKm: number;
  /** UTC offset of the race venue in hours (e.g. Singapore = +8, London = +1 in BST) */
  venueUtcOffset?: number;
  lapRecord?: {
    time: string;
    driver: string;
    year: number;
  };
  sessions: {
    fp1: WeekendSession;
    fp2?: WeekendSession;
    fp3?: WeekendSession;
    sprintQualifying?: WeekendSession;
    sprint?: WeekendSession;
    qualifying: WeekendSession;
    race: WeekendSession;
  };
}

export interface RaceResult {
  round: number;
  grandPrix: string;
  circuit: string;
  season: SeasonYear;
  date: string;
  podium: {
    p1: { driver: string; team: string; time: string; points: number };
    p2: { driver: string; team: string; gap: string; points: number };
    p3: { driver: string; team: string; gap: string; points: number };
  };
  fastestLap?: {
    driver: string;
    team: string;
    time: string;
  };
  dataSource?: string;
  dataUpdatedAt?: string;
}

// ── Raw Race Classification Models (Full 20-driver grid) ──
export interface DetailedRaceResultEntry {
  position: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber?: number;
  teamId: TeamId;
  teamName: string;
  laps: number;
  status: 'Finished' | 'DNF' | 'DNS' | 'DSQ' | string;
  timeOrGap: string;
  points: number;
  sprintPoints?: number;
  fastestLap?: boolean;
  fastestLapTime?: string;
  gridPosition?: number;
}

export interface DetailedRaceResult {
  id: string; // e.g. 'race-2024-r1', 'race-2026-r1'
  season: SeasonYear;
  round: number;
  grandPrix: string;
  officialName: string;
  circuit: string;
  location?: string;
  country?: string;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
  lapsTotal: number;
  winner?: { driver: string; team: string; time: string };
  fastestLap?: { driver: string; team: string; time: string };
  entries: DetailedRaceResultEntry[];
  sprintEntries?: DetailedRaceResultEntry[];
  /**
   * Where `sprintEntries` came from. Provisional (OpenF1 live timing) data
   * may be replaced by newer provisional data or by official synced data;
   * official data is never overwritten by provisional data. Races written
   * before this marker existed are treated as official (preserved).
   */
  sprintProvenance?: 'official' | 'provisional';
  dataSource?: string;
  dataUpdatedAt?: string;
  /**
   * True when entries after P3 are inferred from the podium summary instead of
   * official timing data. Display-only: never feed into standings calculation.
   */
  isSynthesized?: boolean;
}

export interface F1SyncMetadata {
  lastSyncTimestamp: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  source: string;
  completedRoundsCount: number;
  message?: string;
}
