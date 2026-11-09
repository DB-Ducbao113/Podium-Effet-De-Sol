import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendShadowEvidence,
  emptyShadowState,
  fiaDocumentEvidence,
  loadShadowState,
  metricsFor,
  observeOpenF1Session,
  recordValidatedResult,
  updateShadowState,
  validateOpenF1Classification,
} from './shadow.ts';
import type { FiaDocumentMonitor, ShadowEvidenceInput } from './shadow.ts';

const temporaryDirectories: string[] = [];
const session = {
  eventId: '2026-test-gp',
  sessionId: '2026-test-gp-race',
  scheduledEndUtc: '2026-10-18T14:00:00Z',
};

function statePath(): string {
  const directory = mkdtempSync(join(tmpdir(), 'results-engine-shadow-'));
  temporaryDirectories.push(directory);
  return join(directory, 'shadow-state.json');
}

function actualEnd(observedAtUtc: string): ShadowEvidenceInput {
  return {
    kind: 'ACTUAL_SESSION_END',
    source: 'openf1',
    sourceEventId: 'race-control:chequered-event-999',
    occurredAtUtc: '2026-10-18T14:07:30Z',
    observedAtUtc,
    sourceReference: 'https://api.openf1.org/v1/race_control?session_key=999',
  };
}

function completeReport(validatedAtUtc = '2026-10-18T14:20:00Z') {
  return validateOpenF1Classification({
    eventId: session.eventId,
    sessionId: session.sessionId,
    results: [
      { driver_number: 1, position: 1, dns: false, dnf: false, dsq: false },
      { driver_number: 2, position: 2, dns: false, dnf: false, dsq: false },
    ],
    drivers: [
      { driver_number: 1, full_name: 'Driver One' },
      { driver_number: 2, full_name: 'Driver Two' },
    ],
    sourceEventId: 'session-result:complete-999',
    sourceReference: 'https://api.openf1.org/v1/session_result?session_key=999',
    validatedAtUtc,
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

describe('Results Engine shadow mode hardening', () => {
  it('deduplicates the same source event across polls and preserves first-observed time', () => {
    let state = appendShadowEvidence(
      emptyShadowState(),
      session,
      actualEnd('2026-10-18T14:08:00Z'),
    ).state;
    const repeated = appendShadowEvidence(state, session, actualEnd('2026-10-18T14:18:00Z'));
    state = repeated.state;
    const evidence = state.sessions[session.sessionId]!.evidence;
    expect(repeated.duplicate).toBe(true);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.observedAtUtc).toBe('2026-10-18T14:08:00Z');
  });

  it('records partial OpenF1 results as availability but rejects them as a validated classification', async () => {
    const observation = await observeOpenF1Session({
      eventId: session.eventId,
      sessionId: session.sessionId,
      sessionKey: 999,
      observedAtUtc: '2026-10-18T14:10:00Z',
      fetchJson: async (url) => {
        if (url.includes('race_control'))
          return [{ flag: 'CHEQUERED', date: '2026-10-18T14:07:30Z', session_key: 999 }];
        if (url.includes('drivers'))
          return [
            { driver_number: 1, full_name: 'Driver One' },
            { driver_number: 2, full_name: 'Driver Two' },
          ];
        return [{ driver_number: 1, position: 1, dns: false, dnf: false, dsq: false }];
      },
    });
    expect(observation.evidence.map((item) => item.kind)).toEqual([
      'ACTUAL_SESSION_END',
      'SOURCE_RESULT_AVAILABLE',
    ]);
    expect(observation.validationReport).toMatchObject({
      valid: false,
      expectedDriverCount: 2,
      receivedDriverCount: 1,
    });

    let state = emptyShadowState();
    for (const item of observation.evidence)
      state = appendShadowEvidence(state, session, item).state;
    const recorded = recordValidatedResult(
      state,
      session,
      observation.validationReport!,
      '2026-10-18T14:10:00Z',
    );
    expect(recorded.evidence).toBeNull();
    expect(
      recorded.state.validationReports[observation.validationReport!.validationReportId]?.valid,
    ).toBe(false);
    expect(metricsFor(recorded.state, session.sessionId)?.provisionalTarget).toBe('PENDING');
  });

  it('requires a successful, complete validation report before a KPI can pass', () => {
    let state = appendShadowEvidence(
      emptyShadowState(),
      session,
      actualEnd('2026-10-18T14:08:00Z'),
    ).state;
    state = appendShadowEvidence(state, session, {
      kind: 'SOURCE_RESULT_AVAILABLE',
      source: 'openf1',
      sourceEventId: 'session-result:complete-999',
      occurredAtUtc: '2026-10-18T14:15:00Z',
      observedAtUtc: '2026-10-18T14:15:30Z',
      sourceReference: 'https://api.openf1.org/v1/session_result?session_key=999',
    }).state;
    const report = completeReport();
    expect(report.valid).toBe(true);
    state = recordValidatedResult(state, session, report, '2026-10-18T14:20:00Z').state;
    const repeated = recordValidatedResult(
      state,
      session,
      completeReport('2026-10-18T14:25:00Z'),
      '2026-10-18T14:25:00Z',
    );
    state = repeated.state;
    expect(repeated.duplicate).toBe(true);
    expect(metricsFor(state, session.sessionId)).toMatchObject({
      timeToFirstValidatedMinutes: 12.5,
      provisionalTarget: 'PASS',
    });
    expect(() =>
      appendShadowEvidence(state, session, {
        kind: 'VALIDATED_RESULT',
        source: 'operator',
        sourceEventId: 'unsupported',
        occurredAtUtc: '2026-10-18T14:20:00Z',
        observedAtUtc: '2026-10-18T14:20:00Z',
        sourceReference: 'operator:claim',
      }),
    ).toThrow('requires a successful validation report');
  });

  it('rejects duplicate drivers, positions, bad status flags, and incomplete classifications', () => {
    const report = validateOpenF1Classification({
      eventId: session.eventId,
      sessionId: session.sessionId,
      results: [
        { driver_number: 1, position: 1, dns: 'no' },
        { driver_number: 1, position: 1, dnf: true },
      ],
      drivers: [
        { driver_number: 1, full_name: 'Driver One' },
        { driver_number: 2, full_name: 'Driver Two' },
      ],
      sourceEventId: 'session-result:invalid-999',
      sourceReference: 'https://api.openf1.org/v1/session_result?session_key=999',
      validatedAtUtc: '2026-10-18T14:20:00Z',
    });
    expect(report.valid).toBe(false);
    expect(report.errors.join(' ')).toMatch(
      /Duplicate OpenF1 result driver|Duplicate position|Invalid status flag|Incomplete classification/,
    );
  });

  it('requires authoritative FIA metadata for finality and preserves document identities', async () => {
    const monitor: FiaDocumentMonitor = {
      listDocuments: async () => [
        {
          documentId: '87',
          title: 'Provisional Classification',
          classification: 'PROVISIONAL',
          publishedAtUtc: '2026-10-18T14:31:00Z',
          observedAtUtc: '2026-10-18T14:32:00Z',
          url: 'https://www.fia.com/document/87',
          authoritative: true,
        },
      ],
    };
    const [document] = await monitor.listDocuments({
      eventId: session.eventId,
      sessionId: session.sessionId,
    });
    const provisional = fiaDocumentEvidence(document!);
    expect(provisional).toMatchObject({
      kind: 'FIA_PROVISIONAL',
      sourceEventId: 'fia-document:87',
    });
    expect(() =>
      fiaDocumentEvidence({
        ...document!,
        documentId: '90',
        classification: 'FINAL',
        authoritative: false,
      }),
    ).toThrow('authoritative');
    const final = fiaDocumentEvidence({ ...document!, documentId: '90', classification: 'FINAL' });
    let state = appendShadowEvidence(emptyShadowState(), session, provisional).state;
    state = appendShadowEvidence(state, session, final).state;
    expect(state.sessions[session.sessionId]?.evidence.map((item) => item.kind)).toEqual([
      'FIA_PROVISIONAL',
      'FIA_FINAL',
    ]);
  });

  it('serializes concurrent CLI writers from separate processes without losing either evidence event', async () => {
    const path = statePath();
    const first = evidenceFile(path, 'first.json', 'operator:first');
    const second = evidenceFile(path, 'second.json', 'operator:second');
    await Promise.all([runShadowCli(path, first), runShadowCli(path, second)]);
    const persisted = loadShadowState(path);
    expect(
      persisted.sessions[session.sessionId]?.evidence.map((item) => item.sourceEventId).sort(),
    ).toEqual(['operator:first', 'operator:second']);
  });

  it('serializes in-process asynchronous updates too', async () => {
    const path = statePath();
    await Promise.all(
      ['operator:first', 'operator:second'].map((sourceEventId) =>
        updateShadowState(async (state) => {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 15));
          return appendShadowEvidence(state, session, {
            kind: 'SOURCE_DISAGREEMENT',
            source: 'operator',
            sourceEventId,
            occurredAtUtc: '2026-10-18T14:20:00Z',
            observedAtUtc: '2026-10-18T14:20:00Z',
            sourceReference: sourceEventId,
          }).state;
        }, path),
      ),
    );
    expect(loadShadowState(path).sessions[session.sessionId]?.evidence).toHaveLength(2);
  });
});

function evidenceFile(state: string, name: string, sourceEventId: string): string {
  const path = join(dirname(state), name);
  writeFileSync(
    path,
    JSON.stringify([
      {
        kind: 'SOURCE_DISAGREEMENT',
        source: 'operator',
        sourceEventId,
        occurredAtUtc: '2026-10-18T14:20:00Z',
        observedAtUtc: '2026-10-18T14:20:00Z',
        sourceReference: sourceEventId,
      },
    ]),
  );
  return path;
}

function runShadowCli(state: string, evidence: string): Promise<void> {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      process.execPath,
      [
        '--experimental-strip-types',
        'src/results-engine/shadow-cli.ts',
        '--event',
        session.eventId,
        '--session',
        session.sessionId,
        '--scheduled-end',
        session.scheduledEndUtc,
        '--state',
        state,
        '--evidence',
        evidence,
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', rejectRun);
    child.on('close', (code) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`shadow CLI exited ${code}: ${stderr}`));
    });
  });
}
