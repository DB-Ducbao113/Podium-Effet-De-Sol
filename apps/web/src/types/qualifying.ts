import { TeamId } from './team';

export interface QualifyingEntry {
  position: number;
  driverId: string;
  driverName: string;
  driverCode: string;
  driverNumber: number;
  teamId: TeamId;
  teamName: string;
  q1Time?: string;
  q2Time?: string;
  q3Time?: string;
  bestLapTime: string;
  gapToPole: string;
  lapsCompleted?: number;
  sprintPoints?: number;
}

export interface QualifyingSessionResult {
  sessionKey: 'qualifying' | 'sprintQualifying' | 'sprint';
  sessionName: string;
  dateStr: string;
  status: 'finished' | 'live' | 'scheduled';
  poleDriver?: { driver: string; team: string; time: string };
  weather?: string;
  airTempC?: number;
  trackTempC?: number;
  entries: QualifyingEntry[];
}

export interface GrandPrixQualifyingData {
  round: number;
  grandPrix: string;
  season: number;
  circuit: string;
  sessions: {
    qualifying?: QualifyingSessionResult;
    sprintQualifying?: QualifyingSessionResult;
    sprint?: QualifyingSessionResult;
  };
}
