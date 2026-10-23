import { TeamId } from './team';

export interface PracticeSessionEntry {
  position: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: TeamId;
  teamName: string;
  bestLapTime: string;
  gapToP1: string;
  lapsCompleted: number;
}

export interface PracticeSessionResult {
  sessionKey: 'fp1' | 'fp2' | 'fp3';
  sessionName: string; // e.g. 'Practice 1', 'Practice 2', 'Practice 3'
  dateStr: string;
  status: 'finished' | 'live' | 'scheduled';
  weather?: string;
  airTempC?: number;
  trackTempC?: number;
  fastestDriver?: { driver: string; team: string; time: string };
  entries: PracticeSessionEntry[];
}

export interface GrandPrixPracticeData {
  round: number;
  grandPrix: string;
  season: number;
  circuit: string;
  sessions: {
    fp1?: PracticeSessionResult;
    fp2?: PracticeSessionResult;
    fp3?: PracticeSessionResult;
  };
}
