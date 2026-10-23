import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  commitDurableEvidence,
  DurableEvidenceConflictError,
  listDurableRevisions,
  loadDurableHead,
  recoverDurableEvidenceStore,
} from './durable-evidence-store.ts';
import { loadCalendar } from './engine.ts';
import { ObservationRequestError, requestJsonWithPolicy } from './network-policy.ts';
import { runObservationSequence } from './observation-sequence.ts';
import { appendShadowEvidence, emptyShadowState, loadShadowState } from './shadow.ts';

const temporaryDirectories: string[] = [];
const calendarPath = join(
  process.cwd(),
  'src',
  'results-engine',
  'fixtures',
  'm4-observation-calendar.json',
);
const sequencePath = join(
  process.cwd(),
  'src',
  'results-engine',
  'fixtures',
  'm4-multi-snapshot-replay.json',
);

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function temporaryPaths() {
  const directory = mkdtempSync(join(tmpdir(), 'results-engine-phase2-'));
  temporaryDirectories.push(directory);
  return {
    statePath: join(directory, 'shadow-state.json'),
    durableStorePath: join(directory, 'durable'),
  };
}

describe('M4 Phase 2 observation sequence', () => {
  it('preserves every transition, disagreement, latency bound, and restart history', async () => {
    const paths = temporaryPaths();
    const options = {
      calendar: loadCalendar(calendarPath),
      now: new Date('2026-10-18T16:10:00Z'),
      sequencePath,
      ...paths,
    };
    const first = await runObservationSequence(options);
    expect(first.steps).toHaveLength(7);
    expect(first.steps[0]?.events).toContain('NO_RESULT_AVAILABLE');
    expect(first.steps[1]?.events).toContain('SESSION_COMPLETION_OBSERVED');
    expect(first.steps[2]).toMatchObject({ validation: 'PARTIAL' });
    expect(first.steps[3]).toMatchObject({ validation: 'VALID' });
    expect(first.steps[4]?.events).toContain('FIA_PROVISIONAL_REVIEWED');
    expect(first.steps[5]?.events).toContain('FIA_FINAL_REVIEWED');
    expect(first.steps[6]?.events).toContain('FIA_CORRECTED_REVIEWED');
    expect(first.metrics).toMatchObject({
      measurementBasis: 'REPLAY',
      provisionalTarget: 'REPLAY_ONLY',
      sourceDisagreements: 1,
    });
    expect(first.latencyBounds).toEqual({
      availability: {
        lowerBoundMinutes: 0.5,
        upperBoundMinutes: 7.5,
        pollingUncertaintyMinutes: 7,
      },
      validation: {
        lowerBoundMinutes: 7.5,
        upperBoundMinutes: 12.5,
        pollingUncertaintyMinutes: 5,
      },
    });
    expect(first.durable).toMatchObject({ enabled: true, revisionCount: 7 });

    const revisionIds = listDurableRevisions(paths.durableStorePath).map((item) => item.revisionId);
    const second = await runObservationSequence(options);
    expect(second.steps.every((step) => step.observationsAdded === 0)).toBe(true);
    expect(second.durable.revisionCount).toBe(7);
    expect(listDurableRevisions(paths.durableStorePath).map((item) => item.revisionId)).toEqual(
      revisionIds,
    );
    expect(loadShadowState(paths.statePath)).toEqual(
      loadDurableHead(paths.durableStorePath)?.state,
    );
  });

  it('requires a verified synthetic session-key mapping', async () => {
    const paths = temporaryPaths();
    const calendar = loadCalendar(calendarPath);
    const session = calendar[0]!.sessions[0]!;
    const withoutMapping = [
      {
        ...calendar[0]!,
        sessions: [{ ...session, providers: undefined }],
      },
    ];
    await expect(
      runObservationSequence({
        calendar: withoutMapping,
        now: new Date('2026-10-18T16:10:00Z'),
        sequencePath,
        ...paths,
      }),
    ).rejects.toThrow('verified synthetic provider session-key mapping');
  });
});

describe('branch-local durable evidence store', () => {
  it('recovers journal and revision interruptions with verified read-back', async () => {
    const { durableStorePath } = temporaryPaths();
    const initial = emptyShadowState();
    await expect(
      commitDurableEvidence({
        directory: durableStorePath,
        state: initial,
        createdAtUtc: '2026-10-18T14:00:00Z',
        simulateInterruptionAfter: 'JOURNAL',
      }),
    ).rejects.toThrow('Simulated interruption');
    expect((await recoverDurableEvidenceStore(durableStorePath))?.recovered).toBe(true);

    const changed = appendShadowEvidence(
      initial,
      {
        eventId: 'synthetic-event',
        sessionId: 'synthetic-session',
        scheduledEndUtc: '2026-10-18T14:00:00Z',
      },
      {
        kind: 'SOURCE_DISAGREEMENT',
        source: 'operator',
        sourceEventId: 'synthetic-disagreement',
        occurredAtUtc: '2026-10-18T14:10:00Z',
        observedAtUtc: '2026-10-18T14:10:00Z',
        sourceReference: 'replay:synthetic-disagreement',
      },
    ).state;
    await expect(
      commitDurableEvidence({
        directory: durableStorePath,
        state: changed,
        createdAtUtc: '2026-10-18T14:10:00Z',
        simulateInterruptionAfter: 'REVISION',
      }),
    ).rejects.toThrow('Simulated interruption');
    expect((await recoverDurableEvidenceStore(durableStorePath))?.recovered).toBe(true);
    expect(loadDurableHead(durableStorePath)?.state).toEqual(changed);
    expect(
      (
        await commitDurableEvidence({
          directory: durableStorePath,
          state: changed,
          createdAtUtc: '2026-10-18T14:11:00Z',
        })
      ).duplicate,
    ).toBe(true);
  });

  it('rejects stale concurrent-writer expectations', async () => {
    const { durableStorePath } = temporaryPaths();
    const first = await commitDurableEvidence({
      directory: durableStorePath,
      state: emptyShadowState(),
      createdAtUtc: '2026-10-18T14:00:00Z',
      expectedHeadRevisionId: null,
    });
    const changed = appendShadowEvidence(
      emptyShadowState(),
      {
        eventId: 'synthetic-event',
        sessionId: 'synthetic-session',
        scheduledEndUtc: '2026-10-18T14:00:00Z',
      },
      {
        kind: 'SOURCE_DISAGREEMENT',
        source: 'operator',
        sourceEventId: 'first-change',
        occurredAtUtc: '2026-10-18T14:10:00Z',
        observedAtUtc: '2026-10-18T14:10:00Z',
        sourceReference: 'replay:first-change',
      },
    ).state;
    await commitDurableEvidence({
      directory: durableStorePath,
      state: changed,
      createdAtUtc: '2026-10-18T14:10:00Z',
      expectedHeadRevisionId: first.revision.revisionId,
    });
    await expect(
      commitDurableEvidence({
        directory: durableStorePath,
        state: changed,
        createdAtUtc: '2026-10-18T14:11:00Z',
        expectedHeadRevisionId: first.revision.revisionId,
      }),
    ).rejects.toBeInstanceOf(DurableEvidenceConflictError);
  });
});

describe('observation request policy', () => {
  it('backs off on rate limits and succeeds within the configured attempt limit', async () => {
    let attempts = 0;
    const delays: number[] = [];
    const result = await requestJsonWithPolicy({
      url: 'https://example.invalid/results',
      fetchJson: async () => {
        attempts += 1;
        if (attempts < 3) throw new ObservationRequestError('rate limited', 429, 25);
        return { ok: true };
      },
      policy: { timeoutMs: 100, maxAttempts: 3, baseDelayMs: 1, maxRetryDelayMs: 50 },
      sleep: async (milliseconds) => {
        delays.push(milliseconds);
      },
    });
    expect(result).toEqual({ ok: true });
    expect(attempts).toBe(3);
    expect(delays).toEqual([25, 25]);
  });

  it('does not retry a forbidden response and enforces timeouts', async () => {
    let attempts = 0;
    await expect(
      requestJsonWithPolicy({
        url: 'https://example.invalid/forbidden',
        fetchJson: async () => {
          attempts += 1;
          throw new ObservationRequestError('forbidden', 403);
        },
        policy: { timeoutMs: 100, maxAttempts: 3 },
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(attempts).toBe(1);
    await expect(
      requestJsonWithPolicy({
        url: 'https://example.invalid/timeout',
        fetchJson: async () => new Promise(() => undefined),
        policy: { timeoutMs: 5, maxAttempts: 1 },
      }),
    ).rejects.toThrow('timed out');
  });
});
