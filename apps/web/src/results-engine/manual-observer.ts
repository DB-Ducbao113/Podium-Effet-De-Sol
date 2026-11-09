import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { CalendarEvent, SessionDefinition } from './types.ts';
import {
  appendShadowEvidence,
  fiaDocumentEvidence,
  metricsFor,
  observeOpenF1Session,
  openF1ChequeredEvidence,
  recordValidatedResult,
  updateShadowState,
  validateOpenF1Classification,
} from './shadow.ts';
import type {
  ClassificationValidationReport,
  FiaDocumentMetadata,
  ShadowEvidenceInput,
  ShadowMetrics,
  ShadowState,
} from './shadow.ts';
import { requireObservationPermission } from './source-registry.ts';
import type { ObservationFetchJson, ObservationRequestPolicy } from './network-policy.ts';

export interface DiscoveredObservationSession {
  event: CalendarEvent;
  session: SessionDefinition;
  scheduledEndUtc: string;
}

export interface ManualObservationReport {
  mode: 'REPLAY' | 'LIVE_AUTHORIZED';
  eventId: string;
  sessionId: string;
  scheduledEndUtc: string;
  observationsAdded: number;
  duplicatesIgnored: number;
  validation: ClassificationValidationReport | null;
  metrics: ShadowMetrics | null;
  targetClaim: 'NOT_MEASURED' | 'MEASURED';
  statePath: string | undefined;
}

export interface ManualObservationOptions {
  calendar: readonly CalendarEvent[];
  now: Date;
  sessionId?: string;
  statePath?: string;
  replayPath?: string;
  fiaDocumentsPath?: string;
  live?: {
    sessionKey?: number;
    permissionPath?: string;
    manuallyAuthorized: boolean;
    fetchJson?: ObservationFetchJson;
    requestPolicy?: Partial<ObservationRequestPolicy>;
    sleep?: (milliseconds: number) => Promise<void>;
  };
}

export interface ReplaySnapshot {
  schemaVersion: 1;
  sourceRegistryId: 'synthetic-openf1-replay';
  captureId: string;
  completionObservedAtUtc: string;
  resultsObservedAtUtc: string;
  validationObservedAtUtc: string;
  raceControl: unknown;
  results: unknown;
  drivers: unknown;
}

export interface ObservationPayload {
  evidence: readonly ShadowEvidenceInput[];
  validationReport: ClassificationValidationReport | null;
  validatedObservedAtUtc: string;
}

export interface PersistedObservation {
  report: ManualObservationReport;
  state: ShadowState;
}

export function discoverObservationSession(
  calendar: readonly CalendarEvent[],
  now: Date,
  sessionId?: string,
): DiscoveredObservationSession {
  if (!Number.isFinite(now.getTime())) throw new Error('Observation time is invalid');
  const candidates = calendar.flatMap((event) =>
    event.sessions.map((session) => ({ event, session })),
  );
  const selected = sessionId
    ? candidates.find(({ session }) => session.sessionId === sessionId)
    : candidates
        .filter(
          ({ session }) =>
            session.type === 'Race' && Date.parse(session.scheduledStartUtc) <= now.getTime(),
        )
        .sort(
          (left, right) =>
            Date.parse(right.session.scheduledStartUtc) -
            Date.parse(left.session.scheduledStartUtc),
        )[0];
  if (!selected)
    throw new Error(
      sessionId ? `Session not found: ${sessionId}` : 'No race session is discoverable yet',
    );
  const start = Date.parse(selected.session.scheduledStartUtc);
  if (!selected.session.scheduledStartUtc.endsWith('Z') || !Number.isFinite(start))
    throw new Error(`Session ${selected.session.sessionId} must use a UTC scheduledStartUtc`);
  return {
    ...selected,
    scheduledEndUtc: new Date(start + selected.session.durationMinutes * 60_000).toISOString(),
  };
}

export async function runManualObservation(
  options: ManualObservationOptions,
): Promise<ManualObservationReport> {
  if (Boolean(options.replayPath) === Boolean(options.live))
    throw new Error('Choose exactly one observation mode: replay or live');
  const discovered = discoverObservationSession(options.calendar, options.now, options.sessionId);
  const identity = {
    eventId: discovered.event.eventId,
    sessionId: discovered.session.sessionId,
    scheduledEndUtc: discovered.scheduledEndUtc,
  };
  const mode = options.replayPath ? 'REPLAY' : 'LIVE_AUTHORIZED';
  const observation = options.replayPath
    ? observeReplay(discovered, readReplaySnapshot(options.replayPath))
    : await observeLive(discovered, options.live!);
  const fiaDocuments = options.fiaDocumentsPath
    ? readFiaDocumentReviews(options.fiaDocumentsPath)
    : [];
  return (
    await persistObservation({
      identity,
      mode,
      observation,
      fiaDocuments,
      statePath: options.statePath,
    })
  ).report;
}

export async function persistObservation(input: {
  identity: { eventId: string; sessionId: string; scheduledEndUtc: string };
  mode: ManualObservationReport['mode'];
  observation: ObservationPayload;
  fiaDocuments: readonly FiaDocumentMetadata[];
  statePath?: string;
}): Promise<PersistedObservation> {
  let observationsAdded = 0;
  let duplicatesIgnored = 0;
  const state = await updateShadowState((current) => {
    let next = current;
    for (const item of [
      ...input.observation.evidence,
      ...input.fiaDocuments.map(fiaDocumentEvidence),
    ]) {
      const appended = appendShadowEvidence(next, input.identity, item);
      next = appended.state;
      if (appended.duplicate) duplicatesIgnored += 1;
      else observationsAdded += 1;
    }
    if (input.observation.validationReport) {
      const recorded = recordValidatedResult(
        next,
        input.identity,
        input.observation.validationReport,
        input.observation.validatedObservedAtUtc,
      );
      next = recorded.state;
      if (recorded.evidence) {
        if (recorded.duplicate) duplicatesIgnored += 1;
        else observationsAdded += 1;
      } else if (recorded.duplicate) {
        duplicatesIgnored += 1;
      }
    }
    return next;
  }, input.statePath);
  const metrics = metricsFor(state, input.identity.sessionId);
  return {
    state,
    report: {
      mode: input.mode,
      ...input.identity,
      observationsAdded,
      duplicatesIgnored,
      validation: input.observation.validationReport,
      metrics,
      targetClaim: metrics?.measurementBasis === 'LIVE_AUTHORIZED' ? 'MEASURED' : 'NOT_MEASURED',
      statePath: input.statePath,
    },
  };
}

export function observeReplay(
  discovered: DiscoveredObservationSession,
  replay: ReplaySnapshot,
): {
  evidence: ShadowEvidenceInput[];
  validationReport: ClassificationValidationReport | null;
  validatedObservedAtUtc: string;
} {
  const raceControlReference = `replay:${replay.captureId}:race_control`;
  const resultReference = `replay:${replay.captureId}:session_result`;
  const completion = openF1ChequeredEvidence({
    raceControl: replay.raceControl,
    observedAtUtc: replay.completionObservedAtUtc,
    sourceReference: raceControlReference,
  });
  const results = expectArray(replay.results, 'replay results');
  const evidence: ShadowEvidenceInput[] = [];
  if (completion) {
    evidence.push({
      ...completion,
      source: 'replay',
      sourceEventId: completion.sourceEventId.replace('race-control:', 'replay-race-control:'),
      sourceRegistryId: replay.sourceRegistryId,
      observationMode: 'REPLAY',
      detail: 'Synthetic replay of an OpenF1-shaped CHEQUERED observation',
    });
  }
  const sourceEventId = `replay-session-result:${hashSnapshot(results)}`;
  if (results.length > 0) {
    evidence.push({
      kind: 'SOURCE_RESULT_AVAILABLE',
      source: 'replay',
      sourceEventId,
      occurredAtUtc: replay.resultsObservedAtUtc,
      observedAtUtc: replay.resultsObservedAtUtc,
      sourceReference: resultReference,
      sourceRegistryId: replay.sourceRegistryId,
      observationMode: 'REPLAY',
      detail: `${results.length} synthetic replay result records observed`,
    });
  }
  return {
    evidence,
    validationReport:
      results.length === 0
        ? null
        : validateOpenF1Classification({
            eventId: discovered.event.eventId,
            sessionId: discovered.session.sessionId,
            results,
            drivers: replay.drivers,
            sourceEventId,
            sourceReference: resultReference,
            validatedAtUtc: replay.validationObservedAtUtc,
            provider: 'openf1-replay',
          }),
    validatedObservedAtUtc: replay.validationObservedAtUtc,
  };
}

async function observeLive(
  discovered: DiscoveredObservationSession,
  live: NonNullable<ManualObservationOptions['live']>,
) {
  requireObservationPermission({
    sourceId: 'openf1-community-api',
    permissionPath: live.permissionPath,
    manuallyAuthorized: live.manuallyAuthorized,
  });
  const mapping = discovered.session.providers?.openf1;
  const sessionKey = live.sessionKey ?? mapping?.sessionKey;
  if (!Number.isInteger(sessionKey)) throw new Error('A configured OpenF1 session key is required');
  if (mapping?.sessionKey !== sessionKey || mapping?.mappingVerification?.status !== 'REVIEWED') {
    throw new Error('Live observation requires a reviewed calendar session-key mapping');
  }
  const observedAtUtc = new Date().toISOString();
  const observation = await observeOpenF1Session({
    eventId: discovered.event.eventId,
    sessionId: discovered.session.sessionId,
    sessionKey: sessionKey as number,
    observedAtUtc,
    ...(live.fetchJson ? { fetchJson: live.fetchJson } : {}),
    ...(live.requestPolicy ? { requestPolicy: live.requestPolicy } : {}),
    ...(live.sleep ? { sleep: live.sleep } : {}),
  });
  return { ...observation, validatedObservedAtUtc: observedAtUtc };
}

function readReplaySnapshot(path: string): ReplaySnapshot {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(raw)) throw new Error('Replay snapshot must be a JSON object');
  if (
    raw.schemaVersion !== 1 ||
    raw.sourceRegistryId !== 'synthetic-openf1-replay' ||
    typeof raw.captureId !== 'string' ||
    !raw.captureId ||
    !validUtc(raw.completionObservedAtUtc) ||
    !validUtc(raw.resultsObservedAtUtc) ||
    !validUtc(raw.validationObservedAtUtc) ||
    !Array.isArray(raw.raceControl) ||
    !Array.isArray(raw.results) ||
    !Array.isArray(raw.drivers)
  ) {
    throw new Error('Replay snapshot schema is invalid');
  }
  return raw as unknown as ReplaySnapshot;
}

export function readFiaDocumentReviews(path: string): FiaDocumentMetadata[] {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  return validateFiaDocumentReviews(raw);
}

export function validateFiaDocumentReviews(raw: unknown): FiaDocumentMetadata[] {
  if (!Array.isArray(raw)) throw new Error('FIA metadata review file must be an array');
  return raw.map((item) => {
    if (!isRecord(item) || !isRecord(item.review))
      throw new Error('FIA document metadata requires a review record');
    const candidate = item as unknown as FiaDocumentMetadata;
    if (
      !candidate.documentId ||
      !candidate.title ||
      !['PROVISIONAL', 'FINAL', 'CORRECTED'].includes(candidate.classification) ||
      !validUtc(candidate.publishedAtUtc) ||
      !validUtc(candidate.observedAtUtc) ||
      !candidate.url.startsWith('https://') ||
      typeof candidate.authoritative !== 'boolean' ||
      candidate.sourceRegistryId !== 'fia-document-metadata' ||
      !candidate.review?.reviewedBy ||
      !validUtc(candidate.review.reviewedAtUtc) ||
      !['REVIEW_REQUIRED', 'OBSERVATION_APPROVED'].includes(candidate.review.rightsStatus)
    ) {
      throw new Error('FIA document metadata review is incomplete');
    }
    return candidate;
  });
}

function hashSnapshot(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function expectArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function validUtc(value: unknown): value is string {
  return typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
