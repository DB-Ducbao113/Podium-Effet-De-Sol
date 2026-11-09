import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  ObservationRequestError,
  requestJsonWithPolicy,
  type ObservationFetchJson,
  type ObservationRequestPolicy,
} from './network-policy.ts';

/** Read-only evidence; it has no import from publication code. */
export type ShadowEvidenceKind =
  | 'ACTUAL_SESSION_END'
  | 'SOURCE_RESULT_AVAILABLE'
  | 'VALIDATED_RESULT'
  | 'FIA_PROVISIONAL'
  | 'FIA_FINAL'
  | 'FIA_CORRECTED'
  | 'SOURCE_DISAGREEMENT';
export type ShadowSource = 'openf1' | 'replay' | 'fia' | 'operator';
export type FiaClassification = 'PROVISIONAL' | 'FINAL' | 'CORRECTED';
export type ObservationMode = 'LIVE_AUTHORIZED' | 'REPLAY' | 'MANUAL_REVIEW';
export type ClassificationProvider = 'openf1' | 'openf1-replay';

export interface EvidenceReview {
  reviewedBy: string;
  reviewedAtUtc: string;
  rightsStatus: 'REVIEW_REQUIRED' | 'OBSERVATION_APPROVED';
  notes?: string;
}

const shadowEvidenceKinds: readonly ShadowEvidenceKind[] = [
  'ACTUAL_SESSION_END',
  'SOURCE_RESULT_AVAILABLE',
  'VALIDATED_RESULT',
  'FIA_PROVISIONAL',
  'FIA_FINAL',
  'FIA_CORRECTED',
  'SOURCE_DISAGREEMENT',
];
const shadowSources: readonly ShadowSource[] = ['openf1', 'replay', 'fia', 'operator'];
const observationModes: readonly ObservationMode[] = ['LIVE_AUTHORIZED', 'REPLAY', 'MANUAL_REVIEW'];

class ShadowStateLockedError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'ShadowStateLockedError';
    this.cause = cause;
  }
}

export interface ShadowEvidenceInput {
  kind: Exclude<ShadowEvidenceKind, 'VALIDATED_RESULT'>;
  source: ShadowSource;
  /** Stable provider event/document/snapshot identifier, never a poll timestamp. */
  sourceEventId: string;
  occurredAtUtc: string;
  /** First time this observer saw the source event. */
  observedAtUtc: string;
  sourceReference: string;
  sourceRegistryId?: string;
  observationMode?: ObservationMode;
  review?: EvidenceReview;
  detail?: string;
}

export interface ShadowEvidence extends Omit<ShadowEvidenceInput, 'kind'> {
  kind: ShadowEvidenceKind;
  evidenceId: string;
  validationReportId?: string;
}

export interface ShadowSessionLedger {
  eventId: string;
  sessionId: string;
  scheduledEndUtc: string;
  evidence: readonly ShadowEvidence[];
}

/** Only a successful report can create VALIDATED_RESULT evidence. */
export interface ClassificationValidationReport {
  validationReportId: string;
  eventId: string;
  sessionId: string;
  provider: ClassificationProvider;
  sourceEventId: string;
  sourceReference: string;
  validatedAtUtc: string;
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  expectedDriverCount: number;
  receivedDriverCount: number;
}

export interface ShadowState {
  schemaVersion: 2;
  sessions: Record<string, ShadowSessionLedger>;
  validationReports: Record<string, ClassificationValidationReport>;
}

export interface ShadowMetrics {
  actualSessionEndUtc: string | null;
  firstSourceResultAtUtc: string | null;
  firstValidatedResultAtUtc: string | null;
  officialProvisionalAtUtc: string | null;
  officialFinalAtUtc: string | null;
  sourceDisagreements: number;
  timeToFirstAvailableMinutes: number | null;
  timeToFirstValidatedMinutes: number | null;
  timeToOfficialProvisionalMinutes: number | null;
  timeToOfficialFinalMinutes: number | null;
  provisionalTarget: 'PENDING' | 'PASS' | 'FAIL' | 'REPLAY_ONLY';
  measurementBasis: 'NONE' | 'REPLAY' | 'LIVE_AUTHORIZED';
  observedSessionEndUtc: string | null;
}

export interface FiaDocumentMetadata {
  documentId: string;
  title: string;
  classification: FiaClassification;
  publishedAtUtc: string;
  observedAtUtc: string;
  url: string;
  /** Set by a permitted monitor after confirming authoritative FIA metadata. */
  authoritative: boolean;
  sourceRegistryId?: string;
  review?: EvidenceReview;
}

/** A monitor supplies permitted metadata only; it does not scrape, mirror, or publish documents. */
export interface FiaDocumentMonitor {
  listDocuments(input: {
    eventId: string;
    sessionId: string;
  }): Promise<readonly FiaDocumentMetadata[]>;
}

export interface OpenF1ShadowObservation {
  evidence: readonly ShadowEvidenceInput[];
  validationReport: ClassificationValidationReport | null;
}

export const emptyShadowState = (): ShadowState => ({
  schemaVersion: 2,
  sessions: {},
  validationReports: {},
});

export function getShadowStatePath(override?: string): string {
  return resolve(
    override ?? process.env.RESULTS_ENGINE_SHADOW_STATE_PATH ?? '.results-engine/shadow-state.json',
  );
}

/** Missing state starts clean. V1 evidence is preserved conservatively on migration. */
export function loadShadowState(path?: string): ShadowState {
  try {
    const parsed: unknown = JSON.parse(readFileSync(getShadowStatePath(path), 'utf8'));
    if (isShadowState(parsed)) return parsed;
    if (isLegacyShadowState(parsed)) return migrateLegacyState(parsed);
    throw new Error('shadow state schema is invalid');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyShadowState();
    throw error;
  }
}

/** Atomic replacement prevents partial writes, but only updateShadowState serializes writers. */
export function saveShadowState(state: ShadowState, path?: string): void {
  const target = getShadowStatePath(path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(temporary, target);
}

/** Serializes local CLI writers; it is host-local safety, not remote durability. */
export async function updateShadowState(
  updater: (state: ShadowState) => ShadowState | Promise<ShadowState>,
  path?: string,
): Promise<ShadowState> {
  const target = getShadowStatePath(path);
  const lockPath = `${target}.lock`;
  await acquireLock(lockPath);
  try {
    const next = await updater(loadShadowState(target));
    saveShadowState(next, target);
    return next;
  } finally {
    unlinkSync(lockPath);
  }
}

/** Adds immutable source evidence once; repeated polls retain its first-observed time. */
export function appendShadowEvidence(
  state: ShadowState,
  session: Pick<ShadowSessionLedger, 'eventId' | 'sessionId' | 'scheduledEndUtc'>,
  input: unknown,
): { state: ShadowState; duplicate: boolean; evidence: ShadowEvidence } {
  validateSession(session);
  validateEvidenceInput(input);
  const evidence: ShadowEvidence = {
    ...input,
    evidenceId: evidenceIdFor(session, input.source, input.kind, input.sourceEventId),
  };
  return appendEvidence(state, session, evidence);
}

/** Stores a report and creates validated evidence only when validation succeeded. */
export function recordValidatedResult(
  state: ShadowState,
  session: Pick<ShadowSessionLedger, 'eventId' | 'sessionId' | 'scheduledEndUtc'>,
  report: ClassificationValidationReport,
  observedAtUtc: string,
): { state: ShadowState; duplicate: boolean; evidence: ShadowEvidence | null } {
  validateSession(session);
  validateValidationReport(report);
  if (report.eventId !== session.eventId || report.sessionId !== session.sessionId)
    throw new Error('validation report session identity mismatch');
  const existing = state.validationReports[report.validationReportId];
  if (existing && !sameValidationReport(existing, report))
    throw new Error(`validation report identity collision: ${report.validationReportId}`);
  const storedReport = existing ?? report;
  const withReport = existing
    ? state
    : {
        ...state,
        validationReports: { ...state.validationReports, [report.validationReportId]: report },
      };
  if (!storedReport.valid)
    return { state: withReport, duplicate: Boolean(existing), evidence: null };
  const evidence: ShadowEvidence = {
    kind: 'VALIDATED_RESULT',
    source: storedReport.provider === 'openf1-replay' ? 'replay' : 'openf1',
    sourceEventId: storedReport.sourceEventId,
    occurredAtUtc: storedReport.validatedAtUtc,
    observedAtUtc,
    sourceReference: storedReport.sourceReference,
    validationReportId: storedReport.validationReportId,
    sourceRegistryId:
      storedReport.provider === 'openf1-replay'
        ? 'synthetic-openf1-replay'
        : 'openf1-community-api',
    observationMode: storedReport.provider === 'openf1-replay' ? 'REPLAY' : 'LIVE_AUTHORIZED',
    evidenceId: evidenceIdFor(
      session,
      storedReport.provider === 'openf1-replay' ? 'replay' : 'openf1',
      'VALIDATED_RESULT',
      storedReport.sourceEventId,
    ),
  };
  return appendEvidence(withReport, session, evidence);
}

/** Metrics deliberately ignore unsupported completion and validation claims. */
export function metricsFor(state: ShadowState, sessionId: string): ShadowMetrics | null {
  const session = state.sessions[sessionId];
  if (!session) return null;
  const actualEnd = firstOccurrence(session.evidence, isActualCompletion);
  const replayEnd = firstOccurrence(
    session.evidence,
    (item) => item.kind === 'ACTUAL_SESSION_END' && item.source === 'replay',
  );
  const observedEnd = actualEnd ?? replayEnd;
  const firstAvailable = firstOccurrence(
    session.evidence,
    (item) => item.kind === 'SOURCE_RESULT_AVAILABLE',
  );
  const firstValidated = firstOccurrence(session.evidence, (item) => {
    if (item.kind !== 'VALIDATED_RESULT' || !item.validationReportId) return false;
    return state.validationReports[item.validationReportId]?.valid === true;
  });
  const provisional = firstOccurrence(session.evidence, (item) => item.kind === 'FIA_PROVISIONAL');
  const final = firstOccurrence(session.evidence, (item) => item.kind === 'FIA_FINAL');
  const validatedLatency = latencyMinutes(
    observedEnd?.occurredAtUtc,
    firstValidated?.observedAtUtc,
  );
  const measurementBasis = actualEnd ? 'LIVE_AUTHORIZED' : replayEnd ? 'REPLAY' : 'NONE';
  return {
    actualSessionEndUtc: actualEnd?.occurredAtUtc ?? null,
    observedSessionEndUtc: observedEnd?.occurredAtUtc ?? null,
    measurementBasis,
    firstSourceResultAtUtc: firstAvailable?.observedAtUtc ?? null,
    firstValidatedResultAtUtc: firstValidated?.observedAtUtc ?? null,
    officialProvisionalAtUtc: provisional?.observedAtUtc ?? null,
    officialFinalAtUtc: final?.observedAtUtc ?? null,
    sourceDisagreements: session.evidence.filter((item) => item.kind === 'SOURCE_DISAGREEMENT')
      .length,
    timeToFirstAvailableMinutes: latencyMinutes(
      observedEnd?.occurredAtUtc,
      firstAvailable?.observedAtUtc,
    ),
    timeToFirstValidatedMinutes: validatedLatency,
    timeToOfficialProvisionalMinutes: latencyMinutes(
      observedEnd?.occurredAtUtc,
      provisional?.observedAtUtc,
    ),
    timeToOfficialFinalMinutes: latencyMinutes(observedEnd?.occurredAtUtc, final?.observedAtUtc),
    provisionalTarget:
      measurementBasis === 'REPLAY'
        ? 'REPLAY_ONLY'
        : validatedLatency === null
          ? 'PENDING'
          : validatedLatency <= 30
            ? 'PASS'
            : 'FAIL',
  };
}

/** A provider-derived chequered race-control event is the only actual-end signal. */
export function openF1ChequeredEvidence(input: {
  raceControl: unknown;
  observedAtUtc: string;
  sourceReference: string;
}): ShadowEvidenceInput | null {
  if (!Array.isArray(input.raceControl)) throw new Error('OpenF1 race_control must be an array');
  const chequered = input.raceControl
    .filter(isRecord)
    .filter((item) => typeof item.flag === 'string' && item.flag.toUpperCase() === 'CHEQUERED')
    .filter((item) => typeof item.date === 'string' && validUtc(item.date))
    .sort((left, right) => String(left.date).localeCompare(String(right.date)));
  const event = chequered[chequered.length - 1];
  if (!event) return null;
  return {
    kind: 'ACTUAL_SESSION_END',
    source: 'openf1',
    sourceEventId: `race-control:${hashValue({ sourceReference: input.sourceReference, ...sourceEventIdentity(event) })}`,
    occurredAtUtc: event.date as string,
    observedAtUtc: input.observedAtUtc,
    sourceReference: input.sourceReference,
    detail: 'OpenF1 race_control CHEQUERED flag',
  };
}

/** Non-empty OpenF1 results create availability; validation is separately reported. */
export async function observeOpenF1Session(input: {
  eventId: string;
  sessionId: string;
  sessionKey: number;
  observedAtUtc: string;
  fetchJson?: ObservationFetchJson;
  requestPolicy?: Partial<ObservationRequestPolicy>;
  sleep?: (milliseconds: number) => Promise<void>;
}): Promise<OpenF1ShadowObservation> {
  if (!input.eventId || !input.sessionId || !Number.isInteger(input.sessionKey))
    throw new Error('OpenF1 eventId, sessionId, and integer sessionKey are required');
  if (!validUtc(input.observedAtUtc)) throw new Error('OpenF1 observation time must be UTC');
  const fetchJson = input.fetchJson ?? fetchOpenF1Json;
  const key = encodeURIComponent(String(input.sessionKey));
  const raceControlReference = `https://api.openf1.org/v1/race_control?session_key=${key}`;
  const resultsReference = `https://api.openf1.org/v1/session_result?session_key=${key}`;
  const driversReference = `https://api.openf1.org/v1/drivers?session_key=${key}`;
  const request = (url: string) =>
    requestJsonWithPolicy({
      url,
      fetchJson,
      policy: input.requestPolicy,
      sleep: input.sleep,
    });
  // Deliberately sequential: one manual run should not create an avoidable request burst.
  const raceControl = await request(raceControlReference);
  const results = await request(resultsReference);
  const drivers = await request(driversReference);
  if (!Array.isArray(results)) throw new Error('OpenF1 session_result must be an array');
  const evidence: ShadowEvidenceInput[] = [];
  const completion = openF1ChequeredEvidence({
    raceControl,
    observedAtUtc: input.observedAtUtc,
    sourceReference: raceControlReference,
  });
  if (completion)
    evidence.push({
      ...completion,
      sourceRegistryId: 'openf1-community-api',
      observationMode: 'LIVE_AUTHORIZED',
    });
  const sourceEventId = `session-result:${hashValue(normaliseOpenF1Snapshot(results))}`;
  if (results.length > 0) {
    evidence.push({
      kind: 'SOURCE_RESULT_AVAILABLE',
      source: 'openf1',
      sourceEventId,
      occurredAtUtc: input.observedAtUtc,
      observedAtUtc: input.observedAtUtc,
      sourceReference: resultsReference,
      sourceRegistryId: 'openf1-community-api',
      observationMode: 'LIVE_AUTHORIZED',
      detail: `${results.length} OpenF1 session_result records observed`,
    });
  }
  return {
    evidence,
    validationReport:
      results.length > 0
        ? validateOpenF1Classification({
            eventId: input.eventId,
            sessionId: input.sessionId,
            results,
            drivers,
            sourceEventId,
            sourceReference: resultsReference,
            validatedAtUtc: input.observedAtUtc,
          })
        : null,
  };
}

/** Validates identifiers, positions, status flags, and driver-count completeness. */
export function validateOpenF1Classification(input: {
  eventId: string;
  sessionId: string;
  results: unknown;
  drivers: unknown;
  sourceEventId: string;
  sourceReference: string;
  validatedAtUtc: string;
  provider?: ClassificationProvider;
}): ClassificationValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows = Array.isArray(input.results) ? input.results.filter(isRecord) : [];
  const driverRows = Array.isArray(input.drivers) ? input.drivers.filter(isRecord) : [];
  if (!Array.isArray(input.results)) errors.push('OpenF1 session_result must be an array');
  if (!Array.isArray(input.drivers)) errors.push('OpenF1 drivers must be an array');
  if (rows.length !== (Array.isArray(input.results) ? input.results.length : 0))
    errors.push('OpenF1 session_result contains malformed rows');
  if (driverRows.length !== (Array.isArray(input.drivers) ? input.drivers.length : 0))
    errors.push('OpenF1 drivers contains malformed rows');

  const expectedDrivers = new Set<number>();
  for (const driver of driverRows) {
    const number = integer(driver.driver_number);
    if (!number || typeof driver.full_name !== 'string' || !driver.full_name.trim()) {
      errors.push('OpenF1 driver identity is invalid');
      continue;
    }
    if (expectedDrivers.has(number)) errors.push(`Duplicate OpenF1 driver ${number}`);
    expectedDrivers.add(number);
  }
  if (expectedDrivers.size === 0) errors.push('OpenF1 drivers has no valid participants');

  const resultDrivers = new Set<number>();
  const positions = new Set<number>();
  for (const row of rows) {
    const number = integer(row.driver_number);
    if (!number) {
      errors.push('OpenF1 result has invalid driver_number');
      continue;
    }
    if (!expectedDrivers.has(number)) errors.push(`OpenF1 result driver ${number} is unknown`);
    if (resultDrivers.has(number)) errors.push(`Duplicate OpenF1 result driver ${number}`);
    resultDrivers.add(number);
    const position = row.position;
    if (position !== null && position !== undefined) {
      const parsedPosition = integer(position);
      if (!parsedPosition) errors.push(`Invalid position for OpenF1 driver ${number}`);
      else if (positions.has(parsedPosition)) errors.push(`Duplicate position ${parsedPosition}`);
      else positions.add(parsedPosition);
    }
    const flags = ['dns', 'dnf', 'dsq'].filter((key) => row[key] === true);
    if (
      ['dns', 'dnf', 'dsq'].some((key) => row[key] !== undefined && typeof row[key] !== 'boolean')
    )
      errors.push(`Invalid status flag for OpenF1 driver ${number}`);
    if (flags.length > 1) errors.push(`Conflicting status flags for OpenF1 driver ${number}`);
  }
  if (resultDrivers.size !== expectedDrivers.size)
    errors.push(
      `Incomplete classification: received ${resultDrivers.size} of ${expectedDrivers.size} drivers`,
    );
  if (positions.size > 0 && !positions.has(1))
    warnings.push('Classification has no winner position');

  const stable = {
    eventId: input.eventId,
    sessionId: input.sessionId,
    provider: input.provider ?? 'openf1',
    sourceEventId: input.sourceEventId,
    errors,
    warnings,
    expectedDriverCount: expectedDrivers.size,
    receivedDriverCount: resultDrivers.size,
  };
  return {
    validationReportId: `openf1-validation:${hashValue(stable)}`,
    eventId: input.eventId,
    sessionId: input.sessionId,
    provider: input.provider ?? 'openf1',
    sourceEventId: input.sourceEventId,
    sourceReference: input.sourceReference,
    validatedAtUtc: input.validatedAtUtc,
    valid: errors.length === 0,
    errors,
    warnings,
    expectedDriverCount: expectedDrivers.size,
    receivedDriverCount: resultDrivers.size,
  };
}

/** Converts metadata from a permitted FIA monitor; title text alone never declares finality. */
export function fiaDocumentEvidence(input: FiaDocumentMetadata): ShadowEvidenceInput {
  if (!input.documentId || !input.title || !input.url)
    throw new Error('FIA document metadata is incomplete');
  if (
    (input.classification === 'FINAL' || input.classification === 'CORRECTED') &&
    !input.authoritative
  )
    throw new Error('FIA final or corrected classification requires authoritative metadata');
  const kind: ShadowEvidenceKind =
    input.classification === 'PROVISIONAL'
      ? 'FIA_PROVISIONAL'
      : input.classification === 'FINAL'
        ? 'FIA_FINAL'
        : 'FIA_CORRECTED';
  return {
    kind,
    source: 'fia',
    sourceEventId: `fia-document:${input.documentId}`,
    occurredAtUtc: input.publishedAtUtc,
    observedAtUtc: input.observedAtUtc,
    sourceReference: input.url,
    sourceRegistryId: input.sourceRegistryId ?? 'fia-document-metadata',
    observationMode: 'MANUAL_REVIEW',
    ...(input.review ? { review: input.review } : {}),
    detail: input.title,
  };
}

function appendEvidence(
  state: ShadowState,
  session: Pick<ShadowSessionLedger, 'eventId' | 'sessionId' | 'scheduledEndUtc'>,
  evidence: ShadowEvidence,
): { state: ShadowState; duplicate: boolean; evidence: ShadowEvidence } {
  const current = state.sessions[session.sessionId] ?? { ...session, evidence: [] };
  if (
    current.eventId !== session.eventId ||
    current.sessionId !== session.sessionId ||
    current.scheduledEndUtc !== session.scheduledEndUtc
  ) {
    throw new Error(`shadow session identity mismatch for ${session.sessionId}`);
  }
  const existing = current.evidence.find((item) => item.evidenceId === evidence.evidenceId);
  if (existing) return { state, duplicate: true, evidence: existing };
  const nextSession: ShadowSessionLedger = {
    ...current,
    evidence: [...current.evidence, evidence],
  };
  return {
    state: { ...state, sessions: { ...state.sessions, [session.sessionId]: nextSession } },
    duplicate: false,
    evidence,
  };
}

function evidenceIdFor(
  session: Pick<ShadowSessionLedger, 'eventId' | 'sessionId'>,
  source: ShadowSource,
  kind: ShadowEvidenceKind,
  sourceEventId: string,
): string {
  return `evidence:${hashValue({
    eventId: session.eventId,
    sessionId: session.sessionId,
    source,
    kind,
    sourceEventId,
  })}`;
}

function firstOccurrence(
  evidence: readonly ShadowEvidence[],
  predicate: (item: ShadowEvidence) => boolean,
): ShadowEvidence | undefined {
  return evidence
    .filter(predicate)
    .sort((left, right) => Date.parse(left.observedAtUtc) - Date.parse(right.observedAtUtc))[0];
}

function isActualCompletion(evidence: ShadowEvidence): boolean {
  return (
    evidence.kind === 'ACTUAL_SESSION_END' &&
    evidence.source === 'openf1' &&
    evidence.sourceEventId.startsWith('race-control:')
  );
}

function latencyMinutes(startUtc: string | undefined, endUtc: string | undefined): number | null {
  if (!startUtc || !endUtc) return null;
  return Math.round(((Date.parse(endUtc) - Date.parse(startUtc)) / 60_000) * 100) / 100;
}

function validateSession(
  session: Pick<ShadowSessionLedger, 'eventId' | 'sessionId' | 'scheduledEndUtc'>,
) {
  if (!session.eventId || !session.sessionId || !validUtc(session.scheduledEndUtc))
    throw new Error('shadow session requires non-empty IDs and a UTC scheduledEndUtc');
}

function validateEvidenceInput(evidence: unknown): asserts evidence is ShadowEvidenceInput {
  if (!isRecord(evidence)) throw new Error('shadow evidence must be an object');
  if (evidence.kind === 'VALIDATED_RESULT')
    throw new Error('VALIDATED_RESULT requires a successful validation report');
  if (
    typeof evidence.kind !== 'string' ||
    !shadowEvidenceKinds.includes(evidence.kind as ShadowEvidenceKind) ||
    typeof evidence.source !== 'string' ||
    !shadowSources.includes(evidence.source as ShadowSource) ||
    typeof evidence.sourceEventId !== 'string' ||
    !evidence.sourceEventId.trim() ||
    typeof evidence.occurredAtUtc !== 'string' ||
    typeof evidence.observedAtUtc !== 'string' ||
    typeof evidence.sourceReference !== 'string' ||
    !evidence.sourceReference.trim() ||
    (evidence.detail !== undefined && typeof evidence.detail !== 'string')
  ) {
    throw new Error('shadow evidence fields are invalid');
  }
  if (!validUtc(evidence.occurredAtUtc) || !validUtc(evidence.observedAtUtc))
    throw new Error('shadow evidence timestamps must be valid UTC instants');
  if (
    (evidence.sourceRegistryId !== undefined && typeof evidence.sourceRegistryId !== 'string') ||
    (evidence.observationMode !== undefined &&
      !observationModes.includes(evidence.observationMode as ObservationMode)) ||
    (evidence.review !== undefined && !isEvidenceReview(evidence.review))
  )
    throw new Error('shadow evidence provenance is invalid');
}

function validateValidationReport(report: ClassificationValidationReport) {
  if (
    !report.validationReportId ||
    !report.eventId ||
    !report.sessionId ||
    !['openf1', 'openf1-replay'].includes(report.provider) ||
    !report.sourceEventId ||
    !report.sourceReference ||
    !validUtc(report.validatedAtUtc) ||
    typeof report.valid !== 'boolean' ||
    !Array.isArray(report.errors) ||
    !Array.isArray(report.warnings) ||
    !report.errors.every((item) => typeof item === 'string') ||
    !report.warnings.every((item) => typeof item === 'string') ||
    !Number.isInteger(report.expectedDriverCount) ||
    report.expectedDriverCount < 0 ||
    !Number.isInteger(report.receivedDriverCount) ||
    report.receivedDriverCount < 0
  ) {
    throw new Error('validation report is invalid');
  }
  if (
    report.valid &&
    (report.errors.length > 0 || report.receivedDriverCount !== report.expectedDriverCount)
  )
    throw new Error('successful validation report has unsupported completeness claim');
}

function sameValidationReport(
  left: ClassificationValidationReport,
  right: ClassificationValidationReport,
): boolean {
  return (
    left.validationReportId === right.validationReportId &&
    left.eventId === right.eventId &&
    left.sessionId === right.sessionId &&
    left.provider === right.provider &&
    left.sourceEventId === right.sourceEventId &&
    left.sourceReference === right.sourceReference &&
    left.valid === right.valid &&
    JSON.stringify(left.errors) === JSON.stringify(right.errors) &&
    JSON.stringify(left.warnings) === JSON.stringify(right.warnings) &&
    left.expectedDriverCount === right.expectedDriverCount &&
    left.receivedDriverCount === right.receivedDriverCount
  );
}

async function acquireLock(lockPath: string): Promise<void> {
  mkdirSync(dirname(lockPath), { recursive: true });
  const deadline = Date.now() + 5_000;
  while (true) {
    try {
      writeFileSync(
        lockPath,
        `${JSON.stringify({ pid: process.pid, acquiredAtUtc: new Date().toISOString() })}\n`,
        {
          encoding: 'utf8',
          flag: 'wx',
        },
      );
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      if (Date.now() >= deadline)
        throw new ShadowStateLockedError(
          `shadow state is locked: ${lockPath}; verify no writer is active before recovery`,
          error,
        );
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
    }
  }
}

function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function normaliseOpenF1Snapshot(rows: readonly unknown[]): readonly Record<string, unknown>[] {
  return rows
    .filter(isRecord)
    .map((row) => ({
      driver_number: row.driver_number,
      position: row.position,
      number_of_laps: row.number_of_laps,
      duration: row.duration,
      dns: row.dns,
      dnf: row.dnf,
      dsq: row.dsq,
    }))
    .sort((left, right) => String(left.driver_number).localeCompare(String(right.driver_number)));
}

function sourceEventIdentity(event: Record<string, unknown>) {
  return {
    meeting_key: event.meeting_key,
    session_key: event.session_key,
    date: event.date,
    category: event.category,
    flag: event.flag,
    message: event.message,
    lap_number: event.lap_number,
    driver_number: event.driver_number,
  };
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function validUtc(value: string): boolean {
  return value.endsWith('Z') && Number.isFinite(Date.parse(value));
}

function isEvidenceReview(value: unknown): value is EvidenceReview {
  return (
    isRecord(value) &&
    typeof value.reviewedBy === 'string' &&
    value.reviewedBy.trim().length > 0 &&
    typeof value.reviewedAtUtc === 'string' &&
    validUtc(value.reviewedAtUtc) &&
    (value.rightsStatus === 'REVIEW_REQUIRED' || value.rightsStatus === 'OBSERVATION_APPROVED') &&
    (value.notes === undefined || typeof value.notes === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function fetchOpenF1Json(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: 'application/json' }, signal });
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after');
    const retryAfterMs = retryAfter ? parseRetryAfter(retryAfter) : null;
    throw new ObservationRequestError(
      `OpenF1 HTTP ${response.status} for ${url}`,
      response.status,
      retryAfterMs,
    );
  }
  return response.json();
}

function parseRetryAfter(value: string): number | null {
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

function isShadowState(value: unknown): value is ShadowState {
  return (
    isRecord(value) &&
    value.schemaVersion === 2 &&
    isRecord(value.sessions) &&
    isRecord(value.validationReports) &&
    Object.values(value.sessions).every(isShadowSession) &&
    Object.values(value.validationReports).every(isValidationReport)
  );
}

function isLegacyShadowState(
  value: unknown,
): value is { schemaVersion: 1; sessions: Record<string, unknown> } {
  return isRecord(value) && value.schemaVersion === 1 && isRecord(value.sessions);
}

function migrateLegacyState(legacy: {
  schemaVersion: 1;
  sessions: Record<string, unknown>;
}): ShadowState {
  const sessions: Record<string, ShadowSessionLedger> = {};
  for (const [sessionId, rawSession] of Object.entries(legacy.sessions)) {
    if (!isRecord(rawSession) || !Array.isArray(rawSession.evidence))
      throw new Error('legacy shadow state schema is invalid');
    const eventId = rawSession.eventId;
    const scheduledEndUtc = rawSession.scheduledEndUtc;
    if (
      typeof eventId !== 'string' ||
      typeof scheduledEndUtc !== 'string' ||
      !validUtc(scheduledEndUtc)
    )
      throw new Error('legacy shadow session is invalid');
    sessions[sessionId] = {
      eventId,
      sessionId,
      scheduledEndUtc,
      evidence: rawSession.evidence.map((raw, index) =>
        migrateLegacyEvidence(raw, sessionId, eventId, index),
      ),
    };
  }
  return { schemaVersion: 2, sessions, validationReports: {} };
}

function migrateLegacyEvidence(
  raw: unknown,
  sessionId: string,
  eventId: string,
  index: number,
): ShadowEvidence {
  if (!isRecord(raw) || typeof raw.kind !== 'string' || typeof raw.source !== 'string')
    throw new Error('legacy shadow evidence is invalid');
  const occurredAtUtc = raw.occurredAtUtc;
  const observedAtUtc = raw.observedAtUtc;
  const sourceReference = raw.sourceReference;
  if (
    !shadowEvidenceKinds.includes(raw.kind as ShadowEvidenceKind) ||
    !shadowSources.includes(raw.source as ShadowSource) ||
    typeof occurredAtUtc !== 'string' ||
    typeof observedAtUtc !== 'string' ||
    typeof sourceReference !== 'string' ||
    !validUtc(occurredAtUtc) ||
    !validUtc(observedAtUtc)
  ) {
    throw new Error('legacy shadow evidence is invalid');
  }
  const sourceEventId = `legacy:${typeof raw.evidenceId === 'string' ? raw.evidenceId : index}`;
  return {
    kind: raw.kind as ShadowEvidenceKind,
    source: raw.source as ShadowSource,
    sourceEventId,
    occurredAtUtc,
    observedAtUtc,
    sourceReference,
    ...(typeof raw.detail === 'string' ? { detail: raw.detail } : {}),
    evidenceId: evidenceIdFor(
      { eventId, sessionId },
      raw.source as ShadowSource,
      raw.kind as ShadowEvidenceKind,
      sourceEventId,
    ),
  };
}

function isShadowSession(value: unknown): value is ShadowSessionLedger {
  return (
    isRecord(value) &&
    typeof value.eventId === 'string' &&
    typeof value.sessionId === 'string' &&
    typeof value.scheduledEndUtc === 'string' &&
    validUtc(value.scheduledEndUtc) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isShadowEvidence)
  );
}

function isShadowEvidence(value: unknown): value is ShadowEvidence {
  return (
    isRecord(value) &&
    typeof value.evidenceId === 'string' &&
    typeof value.kind === 'string' &&
    shadowEvidenceKinds.includes(value.kind as ShadowEvidenceKind) &&
    typeof value.source === 'string' &&
    shadowSources.includes(value.source as ShadowSource) &&
    typeof value.sourceEventId === 'string' &&
    typeof value.occurredAtUtc === 'string' &&
    validUtc(value.occurredAtUtc) &&
    typeof value.observedAtUtc === 'string' &&
    validUtc(value.observedAtUtc) &&
    typeof value.sourceReference === 'string' &&
    (value.validationReportId === undefined || typeof value.validationReportId === 'string') &&
    (value.sourceRegistryId === undefined || typeof value.sourceRegistryId === 'string') &&
    (value.observationMode === undefined ||
      observationModes.includes(value.observationMode as ObservationMode)) &&
    (value.review === undefined || isEvidenceReview(value.review)) &&
    (value.detail === undefined || typeof value.detail === 'string')
  );
}

function isValidationReport(value: unknown): value is ClassificationValidationReport {
  if (!isRecord(value)) return false;
  try {
    validateValidationReport(value as unknown as ClassificationValidationReport);
    return true;
  } catch {
    return false;
  }
}
