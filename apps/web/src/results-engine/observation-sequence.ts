import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  commitDurableEvidence,
  listDurableRevisions,
  loadDurableHead,
  recoverDurableEvidenceStore,
} from './durable-evidence-store.ts';
import {
  discoverObservationSession,
  observeReplay,
  persistObservation,
  validateFiaDocumentReviews,
  type ManualObservationOptions,
  type ReplaySnapshot,
} from './manual-observer.ts';
import {
  loadShadowState,
  metricsFor,
  openF1ChequeredEvidence,
  updateShadowState,
  type ShadowEvidenceInput,
  type ShadowMetrics,
} from './shadow.ts';

export interface PollingLatencyBounds {
  lowerBoundMinutes: number;
  upperBoundMinutes: number;
  pollingUncertaintyMinutes: number;
}

export interface ObservationSequenceReport {
  mode: 'REPLAY';
  sequenceId: string;
  eventId: string;
  sessionId: string;
  steps: readonly {
    snapshotId: string;
    observedAtUtc: string;
    events: readonly string[];
    observationsAdded: number;
    duplicatesIgnored: number;
    validation: 'NOT_AVAILABLE' | 'PARTIAL' | 'VALID';
    durableRevisionId: string | null;
  }[];
  metrics: ShadowMetrics | null;
  latencyBounds: {
    availability: PollingLatencyBounds | null;
    validation: PollingLatencyBounds | null;
  };
  durable: {
    enabled: boolean;
    recoveredAtStart: boolean;
    headRevisionId: string | null;
    revisionCount: number;
  };
  targetClaim: 'NOT_MEASURED';
}

interface ReplaySequence {
  schemaVersion: 2;
  sourceRegistryId: 'synthetic-openf1-replay';
  sequenceId: string;
  snapshots: ReplaySequenceSnapshot[];
}

interface ReplaySequenceSnapshot {
  snapshotId: string;
  observedAtUtc: string;
  raceControl: unknown[];
  results: unknown[];
  drivers: unknown[];
  comparison?: {
    sourceRegistryId: 'synthetic-cross-source-replay';
    snapshotId: string;
    results: unknown[];
  };
  fiaDocuments?: unknown[];
}

export async function runObservationSequence(options: {
  calendar: ManualObservationOptions['calendar'];
  now: Date;
  sequencePath: string;
  sessionId?: string;
  statePath?: string;
  durableStorePath?: string;
}): Promise<ObservationSequenceReport> {
  const sequence = readReplaySequence(options.sequencePath);
  const discovered = discoverObservationSession(options.calendar, options.now, options.sessionId);
  verifySyntheticSessionMapping(discovered.session);
  const identity = {
    eventId: discovered.event.eventId,
    sessionId: discovered.session.sessionId,
    scheduledEndUtc: discovered.scheduledEndUtc,
  };
  let recoveredAtStart = false;
  if (options.durableStorePath) {
    const recovered = await recoverDurableEvidenceStore(options.durableStorePath);
    recoveredAtStart = recovered?.recovered === true;
    const durableHead = loadDurableHead(options.durableStorePath);
    if (durableHead) await updateShadowState(() => durableHead.state, options.statePath);
  }

  const steps: ObservationSequenceReport['steps'][number][] = [];
  let previousSnapshot: ReplaySequenceSnapshot | null = null;
  let completionAtUtc: string | null = null;
  let availabilityWindow: PollingLatencyBounds | null = null;
  let validationWindow: PollingLatencyBounds | null = null;

  for (const snapshot of sequence.snapshots) {
    const replay: ReplaySnapshot = {
      schemaVersion: 1,
      sourceRegistryId: sequence.sourceRegistryId,
      captureId: sequence.sequenceId,
      completionObservedAtUtc: snapshot.observedAtUtc,
      resultsObservedAtUtc: snapshot.observedAtUtc,
      validationObservedAtUtc: snapshot.observedAtUtc,
      raceControl: snapshot.raceControl,
      results: snapshot.results,
      drivers: snapshot.drivers,
    };
    const baseObservation = observeReplay(discovered, replay);
    const disagreement = comparisonEvidence(sequence, snapshot);
    const observation = {
      ...baseObservation,
      evidence: disagreement
        ? [...baseObservation.evidence, disagreement]
        : baseObservation.evidence,
    };
    const documents = validateFiaDocumentReviews(snapshot.fiaDocuments ?? []);
    const persisted = await persistObservation({
      identity,
      mode: 'REPLAY',
      observation,
      fiaDocuments: documents,
      statePath: options.statePath,
    });
    let durableRevisionId: string | null = null;
    if (options.durableStorePath) {
      const durable = await commitDurableEvidence({
        directory: options.durableStorePath,
        state: persisted.state,
        createdAtUtc: snapshot.observedAtUtc,
      });
      durableRevisionId = durable.revision.revisionId;
    }
    const completion = openF1ChequeredEvidence({
      raceControl: snapshot.raceControl,
      observedAtUtc: snapshot.observedAtUtc,
      sourceReference: `replay:${sequence.sequenceId}:${snapshot.snapshotId}:race_control`,
    });
    if (!completionAtUtc && completion) completionAtUtc = completion.occurredAtUtc;
    if (!availabilityWindow && completionAtUtc && snapshot.results.length > 0)
      availabilityWindow = pollingBounds(
        completionAtUtc,
        previousSnapshot?.observedAtUtc ?? completionAtUtc,
        snapshot.observedAtUtc,
      );
    if (!validationWindow && completionAtUtc && observation.validationReport?.valid)
      validationWindow = pollingBounds(
        completionAtUtc,
        previousSnapshot?.observedAtUtc ?? completionAtUtc,
        snapshot.observedAtUtc,
      );
    steps.push({
      snapshotId: snapshot.snapshotId,
      observedAtUtc: snapshot.observedAtUtc,
      events: stepEvents(snapshot, completion, observation.validationReport?.valid, documents),
      observationsAdded: persisted.report.observationsAdded,
      duplicatesIgnored: persisted.report.duplicatesIgnored,
      validation:
        snapshot.results.length === 0
          ? 'NOT_AVAILABLE'
          : observation.validationReport?.valid
            ? 'VALID'
            : 'PARTIAL',
      durableRevisionId,
    });
    previousSnapshot = snapshot;
  }

  const finalReport = steps[steps.length - 1];
  if (!finalReport) throw new Error('Replay sequence must contain at least one snapshot');
  const head = options.durableStorePath ? loadDurableHead(options.durableStorePath) : null;
  return {
    mode: 'REPLAY',
    sequenceId: sequence.sequenceId,
    eventId: identity.eventId,
    sessionId: identity.sessionId,
    steps,
    metrics: metricsFor(
      options.durableStorePath && head ? head.state : loadShadowState(options.statePath),
      identity.sessionId,
    ),
    latencyBounds: { availability: availabilityWindow, validation: validationWindow },
    durable: {
      enabled: Boolean(options.durableStorePath),
      recoveredAtStart,
      headRevisionId: head?.revisionId ?? null,
      revisionCount: options.durableStorePath
        ? listDurableRevisions(options.durableStorePath).length
        : 0,
    },
    targetClaim: 'NOT_MEASURED',
  };
}

function readReplaySequence(path: string): ReplaySequence {
  const raw: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!isRecord(raw) || raw.schemaVersion !== 2 || !Array.isArray(raw.snapshots))
    throw new Error('Replay sequence schema is invalid');
  if (
    raw.sourceRegistryId !== 'synthetic-openf1-replay' ||
    typeof raw.sequenceId !== 'string' ||
    !raw.sequenceId ||
    raw.snapshots.length === 0
  ) {
    throw new Error('Replay sequence identity is invalid');
  }
  const snapshots = raw.snapshots.map(parseSnapshot);
  for (let index = 1; index < snapshots.length; index += 1) {
    if (
      Date.parse(snapshots[index]!.observedAtUtc) <= Date.parse(snapshots[index - 1]!.observedAtUtc)
    )
      throw new Error('Replay sequence timestamps must be strictly increasing');
  }
  if (new Set(snapshots.map((item) => item.snapshotId)).size !== snapshots.length)
    throw new Error('Replay sequence snapshot IDs must be unique');
  return {
    schemaVersion: 2,
    sourceRegistryId: raw.sourceRegistryId,
    sequenceId: raw.sequenceId,
    snapshots,
  };
}

function parseSnapshot(value: unknown): ReplaySequenceSnapshot {
  if (!isRecord(value)) throw new Error('Replay sequence snapshot must be an object');
  if (
    typeof value.snapshotId !== 'string' ||
    !value.snapshotId ||
    !validUtc(value.observedAtUtc) ||
    !Array.isArray(value.raceControl) ||
    !Array.isArray(value.results) ||
    !Array.isArray(value.drivers) ||
    (value.fiaDocuments !== undefined && !Array.isArray(value.fiaDocuments))
  ) {
    throw new Error('Replay sequence snapshot is invalid');
  }
  if (value.comparison !== undefined) parseComparison(value.comparison);
  return value as unknown as ReplaySequenceSnapshot;
}

function parseComparison(value: unknown): ReplaySequenceSnapshot['comparison'] {
  if (
    !isRecord(value) ||
    value.sourceRegistryId !== 'synthetic-cross-source-replay' ||
    typeof value.snapshotId !== 'string' ||
    !value.snapshotId ||
    !Array.isArray(value.results)
  ) {
    throw new Error('Replay comparison snapshot is invalid');
  }
  return value as unknown as NonNullable<ReplaySequenceSnapshot['comparison']>;
}

function comparisonEvidence(
  sequence: ReplaySequence,
  snapshot: ReplaySequenceSnapshot,
): ShadowEvidenceInput | null {
  if (!snapshot.comparison) return null;
  const primary = normaliseResults(snapshot.results);
  const secondary = normaliseResults(snapshot.comparison.results);
  if (JSON.stringify([...primary]) === JSON.stringify([...secondary])) return null;
  const mismatchDrivers = new Set([...primary.keys(), ...secondary.keys()]);
  const mismatchCount = [...mismatchDrivers].filter(
    (driver) => JSON.stringify(primary.get(driver)) !== JSON.stringify(secondary.get(driver)),
  ).length;
  return {
    kind: 'SOURCE_DISAGREEMENT',
    source: 'replay',
    sourceEventId: `cross-source:${hashValue({ primary: [...primary], secondary: [...secondary] })}`,
    occurredAtUtc: snapshot.observedAtUtc,
    observedAtUtc: snapshot.observedAtUtc,
    sourceReference: `replay:${sequence.sequenceId}:${snapshot.snapshotId}:comparison:${snapshot.comparison.snapshotId}`,
    sourceRegistryId: snapshot.comparison.sourceRegistryId,
    observationMode: 'REPLAY',
    detail: `${mismatchCount} synthetic driver classifications differ across replay sources`,
  };
}

function normaliseResults(rows: unknown[]): Map<number, { position: unknown; status: string }> {
  const result = new Map<number, { position: unknown; status: string }>();
  for (const row of rows) {
    if (!isRecord(row) || !Number.isInteger(row.driver_number)) continue;
    const flags = ['dns', 'dnf', 'dsq'].filter((flag) => row[flag] === true);
    result.set(Number(row.driver_number), {
      position: row.position ?? null,
      status: flags[0] ?? 'classified',
    });
  }
  return new Map([...result].sort(([left], [right]) => left - right));
}

function pollingBounds(
  completionAtUtc: string,
  previousPollAtUtc: string,
  detectedAtUtc: string,
): PollingLatencyBounds {
  const completion = Date.parse(completionAtUtc);
  const previous = Math.max(completion, Date.parse(previousPollAtUtc));
  const detected = Date.parse(detectedAtUtc);
  return {
    lowerBoundMinutes: (previous - completion) / 60_000,
    upperBoundMinutes: (detected - completion) / 60_000,
    pollingUncertaintyMinutes: (detected - previous) / 60_000,
  };
}

function stepEvents(
  snapshot: ReplaySequenceSnapshot,
  completion: ShadowEvidenceInput | null,
  valid: boolean | undefined,
  documents: ReturnType<typeof validateFiaDocumentReviews>,
): string[] {
  const events: string[] = [];
  if (snapshot.results.length === 0) events.push('NO_RESULT_AVAILABLE');
  if (completion) events.push('SESSION_COMPLETION_OBSERVED');
  if (snapshot.results.length > 0)
    events.push(valid ? 'COMPLETE_RESULT_VALIDATED' : 'PARTIAL_RESULT');
  if (snapshot.comparison) events.push('CROSS_SOURCE_COMPARISON');
  for (const document of documents) events.push(`FIA_${document.classification}_REVIEWED`);
  return events;
}

function verifySyntheticSessionMapping(session: {
  providers?: { openf1?: { sessionKey?: number; mappingVerification?: { status: string } } };
}): void {
  const mapping = session.providers?.openf1;
  if (
    !Number.isInteger(mapping?.sessionKey) ||
    mapping?.mappingVerification?.status !== 'SYNTHETIC'
  )
    throw new Error('Replay sequence requires a verified synthetic provider session-key mapping');
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function validUtc(value: unknown): value is string {
  return typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
