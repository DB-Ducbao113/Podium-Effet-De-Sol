/** Canonical, provider-neutral contracts for the offline-first Results Engine. */
export const sessionTypes = [
  'Practice',
  'Qualifying',
  'Sprint',
  'SprintQualifying',
  'Race',
] as const;

export type SessionType = (typeof sessionTypes)[number];
export type ClassificationStatus = 'PENDING' | 'PROVISIONAL' | 'FINAL' | 'CORRECTED';
export type SourceLicense = 'SYNTHETIC' | 'RESTRICTED' | 'APPROVED' | 'UNKNOWN';
export type ProviderId = 'fixture' | 'openf1' | 'jolpica';
export type EngineSessionState =
  'SCHEDULED' | 'RUNNING' | 'RESULT_PENDING' | 'PROVISIONAL' | 'FINAL' | 'CORRECTED';

export interface Driver {
  driverId: string;
  fullName: string;
  country: string | null;
}

export interface DriverResult {
  driver: Driver;
  position: number | null;
  laps: number | null;
  time: string | null;
  points: number | null;
  status: string;
  penalties: readonly string[];
}

export interface ResultSource {
  provider: ProviderId;
  license: SourceLicense;
  retrievedAtUtc: string;
  sourceReference: string;
}

/** The only result format accepted by state and publication code. */
export interface SessionResult {
  eventId: string;
  sessionId: string;
  type: SessionType;
  startUtc: string;
  endUtc: string;
  classificationStatus: ClassificationStatus;
  driverResults: readonly DriverResult[];
  source: ResultSource;
}

export interface SessionDefinition {
  type: SessionType;
  sessionId: string;
  scheduledStartUtc: string;
  durationMinutes: number;
  /** Explicit external IDs; no provider infers these from a display name. */
  providers?: Partial<Record<Exclude<ProviderId, 'fixture'>, ProviderSessionReference>>;
}

export interface ProviderSessionReference {
  sessionKey?: number;
  year?: number;
  round?: number;
  mappingVerification?: ProviderMappingVerification;
}

export interface ProviderMappingVerification {
  status: 'SYNTHETIC' | 'REVIEWED';
  verifiedBy: string;
  verifiedAtUtc: string;
  evidenceReference: string;
}

export interface CalendarEvent {
  eventId: string;
  name: string;
  sessions: readonly SessionDefinition[];
}

export interface VerificationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ResultRevision {
  revisionId: string;
  sessionId: string;
  parentRevisionId: string | null;
  createdAtUtc: string;
  classificationStatus: ClassificationStatus;
  result: SessionResult;
}

export interface SessionContext {
  eventId: string;
  sessionId: string;
  type: SessionType;
  state: EngineSessionState;
  lastUpdateUtc: string;
  latestRevisionId: string | null;
  revisionIds: readonly string[];
}

export interface EngineState {
  schemaVersion: 1;
  sessions: Record<string, SessionContext>;
  revisions: Record<string, ResultRevision>;
}
